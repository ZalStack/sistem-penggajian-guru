<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class ContentSpec extends SpecModule
{
    public function paths(): array
    {
        return array_merge(
            $this->notifications(),
        );
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
