<?php

namespace App\OpenApi\Specs;

use App\OpenApi\SpecModule;

class PayrollSpec extends SpecModule
{
    public function paths(): array
    {
        return $this->operations();
    }

    private function operations(): array
    {
        $payrollBody = [
            'type' => 'object',
            'required' => ['guru_id', 'periode', 'jumlah_sesi', 'transport_id'],
            'properties' => [
                'guru_id' => ['type' => 'integer', 'example' => 1],
                'periode' => ['type' => 'string', 'maxLength' => 7, 'description' => 'Salary period in `YYYY-MM` format.', 'example' => '2026-10'],
                'jumlah_sesi' => ['type' => 'integer', 'minimum' => 1, 'example' => 8],
                'transport_id' => ['type' => 'integer', 'example' => 1],
            ],
        ];

        return [
            '/salaries' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'List payroll records (admin)',
                    'description' => 'Paginated salary records with teacher and transport details. Sensitive — requires an admin token.',
                    'parameters' => [
                        $this->stringParam('periode', 'Filter by month (`YYYY-MM`).', '2026-10'),
                        $this->integerParam('filter_guru', 'Filter by teacher ID.', 1),
                        $this->enumParam('status_bayar', 'Filter by payment status.', ['belum_dibayar', 'sudah_dibayar']),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of payroll records.', $this->ref('Salary')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/salaries/calculate' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'Recalculate payroll for a period (admin)',
                    'description' => 'Recomputes salary records from each teacher\'s valid attendances for the given period. Pass `guru_id` to recalculate a single teacher. Throttled to 1 request per minute.',
                    'requestBody' => $this->jsonBody([
                        'type' => 'object',
                        'required' => ['periode'],
                        'properties' => [
                            'periode' => ['type' => 'string', 'minLength' => 7, 'maxLength' => 7, 'example' => '2026-10'],
                            'guru_id' => ['type' => 'integer', 'nullable' => true, 'description' => 'Limit the recalculation to one teacher.'],
                        ],
                    ]),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Recalculation finished.', $this->ref('CalculateResponse'), 'Salary recalculated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                        '429' => 'TooManyRequests',
                    ]),
                ]),
            ],
            '/salaries/mine' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'My salary history (teacher)',
                    'description' => 'Returns the authenticated teacher\'s salary records with totals and the current month record.',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Salary history and summary.', $this->ref('MySalaries')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/salaries/mine/{salary}/payslip' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'Download my payslip PDF (teacher)',
                    'description' => 'Downloads the A5 payslip PDF for one of the authenticated teacher\'s own salary records. Returns 404 for records that belong to another teacher.',
                    'parameters' => [$this->idParam('salary', 'The payroll record ID.')],
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The payslip PDF document.',
                            'content' => ['application/pdf' => ['schema' => ['type' => 'string', 'format' => 'binary']]],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/salaries/{salary}/pay' => [
                'post' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'Mark a payroll record as paid (admin)',
                    'parameters' => [$this->idParam('salary', 'The payroll record ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Payment status updated.', $this->ref('Salary'), 'Payment status updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/salaries/{salary}/payslip' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Salaries'],
                    'summary' => 'Download a payslip PDF (admin)',
                    'parameters' => [$this->idParam('salary', 'The payroll record ID.')],
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The payslip PDF document.',
                            'content' => ['application/pdf' => ['schema' => ['type' => 'string', 'format' => 'binary']]],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/payroll' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'List payroll records with filters (admin)',
                    'description' => 'Manual payroll management list. Sensitive — requires an admin token.',
                    'parameters' => [
                        $this->stringParam('periode', 'Filter by month (`YYYY-MM`).', '2026-10'),
                        $this->integerParam('filter_grade', 'Filter by the teacher\'s grade ID.', 1),
                        $this->integerParam('filter_transport', 'Filter by transport ID.', 1),
                        $this->refParam('page'),
                        $this->refParam('per_page'),
                    ],
                    'responses' => $this->withErrors([
                        '200' => $this->listResponse('A paginated list of payroll records.', $this->ref('Salary')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'post' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'Create a payroll record (admin)',
                    'description' => 'Honor and transport totals are computed server-side: `honor = grade.honor_per_sesi × jumlah_sesi`, `total_transport = transport.biaya × jumlah_sesi`. Returns 422 when the teacher already has a record for the same period and transport.',
                    'requestBody' => $this->jsonBody($payrollBody),
                    'responses' => $this->withErrors([
                        '201' => $this->objectResponse('Payroll record created.', $this->ref('Salary'), 'Payroll record created successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/payroll/options' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'Lookup data for payroll forms (admin)',
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Lookup data.', $this->ref('PayrollOptions')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                    ]),
                ]),
            ],
            '/payroll/{payroll}' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'Get a payroll record (admin)',
                    'parameters' => [$this->idParam('payroll', 'The payroll record ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The requested payroll record.', $this->ref('Salary')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
                'put' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'Update a payroll record (admin)',
                    'description' => 'Totals are recomputed server-side from the grade and transport values.',
                    'parameters' => [$this->idParam('payroll', 'The payroll record ID.')],
                    'requestBody' => $this->jsonBody($payrollBody),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Payroll record updated.', $this->ref('Salary'), 'Payroll record updated successfully.'),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                        '422' => 'Unprocessable',
                    ]),
                ]),
                'delete' => array_merge($this->secured(), [
                    'tags' => ['Payroll'],
                    'summary' => 'Delete a payroll record (admin)',
                    'description' => 'Returns 409 when the record has already been paid.',
                    'parameters' => [$this->idParam('payroll', 'The payroll record ID.')],
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('Payroll record deleted.', ['type' => 'object', 'nullable' => true, 'example' => null], 'Payroll record deleted successfully.'),
                        '409' => 'Conflict',
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '404' => 'NotFound',
                    ]),
                ]),
            ],
            '/reports' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Reports'],
                    'summary' => 'Payroll report (admin)',
                    'description' => 'Filtered payroll report with grand totals. Sensitive — requires an admin token.',
                    'parameters' => $this->reportParams(),
                    'responses' => $this->withErrors([
                        '200' => $this->objectResponse('The payroll report.', $this->ref('ReportIndex')),
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/reports/export-pdf' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Reports'],
                    'summary' => 'Export the payroll report as PDF (admin)',
                    'parameters' => $this->reportParams(),
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The PDF document.',
                            'content' => ['application/pdf' => ['schema' => ['type' => 'string', 'format' => 'binary']]],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
            '/reports/export-excel' => [
                'get' => array_merge($this->secured(), [
                    'tags' => ['Reports'],
                    'summary' => 'Export the payroll report as Excel (admin)',
                    'parameters' => $this->reportParams(),
                    'responses' => $this->withErrors([
                        '200' => [
                            'description' => 'The Excel document.',
                            'content' => [
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => [
                                    'schema' => ['type' => 'string', 'format' => 'binary'],
                                ],
                            ],
                        ],
                    ], [
                        '401' => 'Unauthorized',
                        '403' => 'Forbidden',
                        '422' => 'Unprocessable',
                    ]),
                ]),
            ],
        ];
    }

    private function reportParams(): array
    {
        return [
            $this->stringParam('periode', 'Filter by month (`YYYY-MM`).', '2026-10'),
            $this->integerParam('filter_grade', 'Filter by the teacher\'s grade ID.', 1),
            $this->enumParam('filter_mapel', 'Filter by subject.', ['IPA', 'MTK']),
            $this->integerParam('filter_transport', 'Filter by transport ID.', 1),
        ];
    }
}
