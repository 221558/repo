export interface OrderDialogProps {
  task_type: string;
  alert_id?: string;
  log_object?: string;
  log_action?: string;
  params?: Record<string, any>;
  unuse_params?: string;
}
