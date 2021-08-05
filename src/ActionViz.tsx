import {
  ActionObject,
  ActionTypes,
  CancelAction,
  LogAction,
  LogActionObject,
  RaiseAction,
  RaiseActionObject,
  SendAction,
  SendActionObject,
  StopAction,
} from 'xstate';
import { getActionLabel } from './utils';

export const RaiseActionLabel: React.FC<{ action: RaiseAction<any> }> = ({
  action,
}) => {
  return (
    <div data-viz="action-type">
      <strong>raise</strong> {action.event}
    </div>
  );
};

export const SendActionLabel: React.FC<{ action: SendActionObject<any, any> }> =
  ({ action }) => {
    console.log(action);
    return (
      <div data-viz="action-type">
        <strong>send</strong> {action.event.type}{' '}
        {action.to ? `to ${action.to}` : ''}
      </div>
    );
  };

export const LogActionLabel: React.FC<{ action: LogAction<any, any> }> = ({
  action,
}) => {
  console.log(action);
  return (
    <div data-viz="action-type">
      <strong>log</strong> {action.label}
    </div>
  );
};

export const CancelActionLabel: React.FC<{ action: CancelAction }> = ({
  action,
}) => {
  console.log(action);
  return (
    <div data-viz="action-type">
      <strong>cancel</strong> {action.sendId}
    </div>
  );
};

export const StopActionLabel: React.FC<{ action: StopAction<any, any> }> = ({
  action,
}) => {
  console.log(action);
  return (
    <div data-viz="action-type">
      <strong>stop</strong>{' '}
      {typeof action.activity === 'object' && 'id' in action.activity ? (
        action.activity.id
      ) : (
        <em>expr</em>
      )}
    </div>
  );
};

export const ActionViz: React.FC<{
  action: ActionObject<any, any>;
  kind: 'entry' | 'exit' | 'do';
}> = ({ action, kind }) => {
  const actionType = {
    [ActionTypes.Raise]: (
      <RaiseActionLabel action={action as RaiseAction<any>} />
    ),
    [ActionTypes.Send]: (
      <SendActionLabel action={action as SendActionObject<any, any>} />
    ),
    [ActionTypes.Log]: (
      <LogActionLabel action={action as LogAction<any, any>} />
    ),
    [ActionTypes.Cancel]: <CancelActionLabel action={action as CancelAction} />,
    [ActionTypes.Stop]: (
      <StopActionLabel action={action as StopAction<any, any>} />
    ),
  }[action.type] ?? <div data-viz="action-type">{getActionLabel(action)}</div>;

  return (
    <div data-viz="action" data-viz-action={kind}>
      {actionType}
    </div>
  );
};
