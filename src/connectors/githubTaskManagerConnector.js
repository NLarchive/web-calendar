import { BaseConnector } from './baseConnector.js';

export class GitHubTaskManagerConnector extends BaseConnector {
  constructor() {
    super('github-task-manager-connector');
  }

  mapAppointmentToTask(appointment) {
    return {
      title: appointment.title,
      body: appointment.description,
      labels: appointment.tags || [],
      metadata: {
        date: appointment.date,
        recurrence: appointment.recurrence,
        category: appointment.category,
        priority: appointment.priority,
      },
    };
  }
}
