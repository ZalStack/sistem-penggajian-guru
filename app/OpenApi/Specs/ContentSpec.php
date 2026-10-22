<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class ContentSpec extends SpecModule
{
    public function paths(): array
    {
        return array_merge(
            $this->teachingMaterials(),
            $this->notifications(),
        );
    }

    private function teachingMaterials(): array
    {
        $metaBody = [
            'type' => 'object',
            'required' => ['judul', 'mapel'],
            'properties' => [
                'judul' => ['type' => 'string', 'example' => 'Algebra Basics'],
                'deskripsi' => ['type' => 'string', 'nullable' => true, 'maxLength' => 2000],
                'mapel' => ['type' => 'string', 'enum' => ['IPA', 'MTK', 'umum']],
            ],
        ];

        return [
            '/teaching-materials' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'List teaching materials',
                    'description' => 'Searchable list of uploaded teaching materials. Public — no token required. The `download_url` field is only present for authenticated requests.',
                    'parameters' => [
                        $this->stringParam('search', 'Search by title or description.'),
                        $this->enumParam('filter_mapel', 'Filter by subject.', ['IPA', 'MTK', 'umum']),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of teaching materials.', $this->ref('TeachingMaterial')),
                    ], []),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'Upload a teaching material (admin)',
                    'description' => 'Uploads the file (max 10 MB; PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG, PNG, WEBP, or ZIP) and notifies every teacher account. The response includes `notified_teachers` with the number of notifications sent.',
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'multipart/form-data' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['judul', 'mapel', 'file'],
                                    'properties' => array_merge($metaBody['properties'], [
                                        'file' => [
                                            'type' => 'string',
                                            'format' => 'binary',
                                            'description' => 'The material file. Max 10 MB.',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Material uploaded.', $this->ref('MaterialUploadResponse'), 'Teaching material uploaded successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/teaching-materials/{material}' => [
                'get' => array_merge($this->public(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'Get a teaching material',
                    'parameters' => [$this->idParam('material', 'The teaching material ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested material.', $this->ref('TeachingMaterial')),
                    ], [
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'Update a teaching material (admin)',
                    'description' => 'Updates the metadata and optionally replaces the file (send `file` again).',
                    'parameters' => [$this->idParam('material', 'The teaching material ID.')],
                    'requestBody' => [
                        'required' => true,
                        'content' => [
                            'multipart/form-data' => [
                                'schema' => [
                                    'type' => 'object',
                                    'required' => ['judul', 'mapel'],
                                    'properties' => array_merge($metaBody['properties'], [
                                        'file' => [
                                            'type' => 'string',
                                            'format' => 'binary',
                                            'nullable' => true,
                                            'description' => 'Optional replacement file. Max 10 MB.',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Material updated.', $this->ref('TeachingMaterial'), 'Teaching material updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'Delete a teaching material (admin)',
                    'description' => 'Deletes the record and the physical file from storage.',
                    'parameters' => [$this->idParam('material', 'The teaching material ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Material deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Teaching material deleted successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/teaching-materials/{material}/download' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Teaching Materials'],
                    'summary' => 'Download the material file',
                    'description' => 'Streams the original file. Requires any valid token (teachers and admins).',
                    'parameters' => [$this->idParam('material', 'The teaching material ID.')],
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The material file.',
                            'content' => ['application/octet-stream' => ['schema' => ['type' => 'string', 'format' => 'binary']]],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
        ];
    }

    private function notifications(): array
    {
        return [
            '/notifications' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Notifications'],
                    'summary' => 'List my notifications',
                    'description' => 'Paginated in-app notifications for the authenticated user. The pagination meta also contains `unread_count`.',
                    'parameters' => [
                        $this->enumParam('status', 'Filter by read state.', ['read', 'unread']),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of notifications.', $this->ref('Notification')),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/notifications/unread-count' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Notifications'],
                    'summary' => 'Get my unread notification count',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The unread count.', $this->ref('UnreadCountResponse')),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/notifications/mark-all-read' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Notifications'],
                    'summary' => 'Mark all notifications as read',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Notifications marked as read.', $this->ref('MarkAllReadResponse'), 'All notifications marked as read.'),
                    ], [
                        '401' => 'Unauthorized',
                    ]),
                ]),
            ],
            '/notifications/{notification}' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Notifications'],
                    'summary' => 'Get a notification (marks it as read)',
                    'description' => 'Returns a single notification and marks it as read when it was unread. Returns 403 for notifications that belong to another user.',
                    'parameters' => [$this->idParam('notification', 'The notification ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested notification.', $this->ref('Notification')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
        ];
    }
}
