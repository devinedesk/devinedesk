export interface DevineDeskConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface WorkflowExecuteResponse {
  success: boolean;
  runId: string;
}

export class DevineDeskClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: DevineDeskConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.devinedesk.com/v1';
  }

  private async fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`DevineDesk API Error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  public workflows = {
    /**
     * Executes a workflow by its ID.
     * @param id The Workflow ID (e.g. wf_123)
     * @param inputs Key-value mapping of node inputs
     */
    execute: (id: string, inputs: Record<string, any>): Promise<WorkflowExecuteResponse> => {
      return this.fetchAPI<WorkflowExecuteResponse>(`/workflows/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ inputs }),
      });
    },

    /**
     * Polls the status of an active workflow run.
     * @param runId The Run ID returned from execute()
     */
    status: (runId: string): Promise<any> => {
      return this.fetchAPI<any>(`/runs/${runId}`, {
        method: 'GET',
      });
    },
  };
}
