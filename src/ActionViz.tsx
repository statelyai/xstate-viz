import {
  ActionObject,
  ActionTypes,
  AssignAction,
  CancelAction,
  ChooseAction,
  LogAction,
  RaiseAction,
  SendActionObject,
  SpecialTargets,
  StopAction,
} from 'xstate';
import { isDelayedTransitionAction, isStringifiedFunction } from './utils';

export function getActionLabel(
  action: ActionObject<any, any>,
): string | JSX.Element {
  if (typeof action.exec === 'function') {
    return isStringifiedFunction(action.type) ? (
      <em>anonymous</em>
    ) : (
      action.type
    );
  }
  if (action.type.startsWith('xstate.')) {
    const builtInActionType = action.type.match(/^xstate\.(.+)$/)![1];
    return <strong>{builtInActionType}</strong>;
  }
  return action.type;
}

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
    const actionLabel =
      action.event.type === 'xstate.update' ? (
        <strong>send update</strong>
      ) : (
        <>
          <strong>send</strong> {action.event.type}
        </>
      );
    const actionTo = action.to ? (
      action.to === SpecialTargets.Parent ? (
        <>
          to <em>parent</em>
        </>
      ) : (
        <>to {action.to}</>
      )
    ) : (
      ''
    );
    return (
      <div data-viz="action-type">
        {actionLabel} {actionTo}
      </div>
    );
  };

export const LogActionLabel: React.FC<{ action: LogAction<any, any> }> = ({
  action,
}) => {
  return (
    <div data-viz="action-type">
      <strong>log</strong> {action.label}
    </div>
  );
};

export const CancelActionLabel: React.FC<{ action: CancelAction }> = ({
  action,
}) => {
  return (
    <div data-viz="action-type">
      <strong>cancel</strong> {action.sendId}
    </div>
  );
};

export const StopActionLabel: React.FC<{ action: StopAction<any, any> }> = ({
  action,
}) => {
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

export const AssignActionLabel: React.FC<{ action: AssignAction<any, any> }> =
  ({ action }) => {
    return (
      <div data-viz="action-type">
        <strong>assign</strong>{' '}
        {typeof action.assignment === 'object' ? (
          Object.keys(action.assignment).join(', ')
        ) : (
          <em>{action.assignment.name || 'expr'}</em>
        )}
      </div>
    );
  };

export const ChooseActionLabel: React.FC<{ action: ChooseAction<any, any> }> =
  ({ action }) => {
    return (
      <div data-viz="action-type">
        <strong>choose</strong>
      </div>
    );
  };

export const ActionViz: React.FC<{
  action: ActionObject<any, any>;
  kind: 'entry' | 'exit' | 'do';
}> = ({ action, kind }) => {
  if (isDelayedTransitionAction(action)) {
    // Don't show implicit actions for delayed transitions
    return null;
  }

  const actionType = {
    [ActionTypes.Assign]: (
      <AssignActionLabel action={action as AssignAction<any, any>} />
    ),
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
    [ActionTypes.Choose]: (
      <ChooseActionLabel action={action as ChooseAction<any, any>} />
    ),
  }[action.type] ?? <div data-viz="action-type">{getActionLabel(action)}</div>;

  return (
    <div data-viz="action" data-viz-action={kind}>
      {actionType}
    </div>
  );
};
