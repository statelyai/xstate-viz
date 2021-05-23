import { DirectedGraphNode } from '@xstate/graph';
import { useMachine } from '@xstate/react';
import ELK, { ElkNode } from 'elkjs/lib/main';
import { createMachine, StateNode } from 'xstate';
import { assign } from 'xstate/lib/actions';
import { getRect, onRect, readRect, rectMap } from './getRect';
import { StateNodeViz } from './StateNodeViz';
const elk = new ELK();

const graph = {
  id: 'root',
  layoutOptions: { algorithm: 'layered' },
  children: [
    { id: 'n1', width: 30, height: 30 },
    { id: 'n2', width: 30, height: 30 },
    {
      id: 'n3',
      width: 30,
      height: 30,
      children: [
        { id: 'a1', width: 30, height: 30 },
        { id: 'a2', width: 30, height: 30 },
        { id: 'a3', width: 30, height: 30 },
      ],
    },
  ],
  edges: [
    { id: 'e1', sources: ['n1'], targets: ['n2'] },
    { id: 'e2', sources: ['n1'], targets: ['n3'] },
  ],
};

function getElkChild(node: DirectedGraphNode): ElkNode {
  const nodeRect = getRect(node.id);
  const contentRect = readRect(`${node.id}:content`);

  return {
    id: node.id,
    ...(!node.children.length
      ? {
          width: nodeRect?.width,
          height: nodeRect?.height,
        }
      : undefined),
    // width: node.rects.full.width,
    // height: node.rects.full.height,
    // @ts-ignore
    node: node.stateNode,
    ...(node.children.length ? { children: getElkChildren(node) } : undefined),
    // edges: map.get(node)?.map((edge) => {
    //   return {
    //     id: edge.id,
    //     sources: [edge.source.id],
    //     targets: [edge.target.id],
    //     labels: [
    //       {
    //         id: edge.id,
    //         width: edge.rects.self.width,
    //         height: edge.rects.self.height,
    //         text: '??',
    //       },
    //     ],
    //   };
    // }),

    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.padding': `[top=${
        (contentRect?.height || 0) + 30
      }, left=30, right=30, bottom=30]`,
      // 'elk.padding': `[top=${
      //   node.rects.self.height + 30
      // }, right=30, bottom=30, left=30]`,
    },
  };
}
function getElkChildren(node: DirectedGraphNode): ElkNode[] {
  return node.children.map((childNode) => {
    return getElkChild(childNode);
  });
}

type StateElkNode = ElkNode & { node: StateNode<any, any, any> };

const GraphNode: React.FC<{ elkNode: StateElkNode }> = ({ elkNode }) => {
  return <StateNodeViz stateNode={elkNode.node} />;
};

export async function getElkGraph(
  digraph: DirectedGraphNode,
): Promise<ElkNode> {
  await new Promise((res) => {
    onRect(digraph.id, (data) => {
      res(void 0);
    });
  });

  const elkNode = getElkChild(digraph);

  const layoutNode = await elk.layout(elkNode);

  const setLayout = (n: StateElkNode) => {
    n.node.version = `${Math.random()}`;
    n.node.meta = {
      layout: {
        width: n.width!,
        height: n.height!,
        x: n.x!,
        y: n.y!,
      },
    };

    n.children?.forEach((cn) => {
      setLayout(cn as StateElkNode);
    });
  };

  setLayout(layoutNode as StateElkNode);

  return layoutNode;
}

export const Graph: React.FC<{ digraph: DirectedGraphNode }> = ({
  digraph,
}) => {
  const [state] = useMachine(
    createMachine({
      context: {
        elkGraph: undefined,
      },
      initial: 'loading',
      states: {
        loading: {
          invoke: {
            src: () => getElkGraph(digraph),
            onDone: {
              target: 'success',
              actions: assign({
                elkGraph: (_, e) => e.data,
              }),
            },
          },
        },
        success: {},
      },
    }),
  );

  console.log(state.context.elkGraph);

  if (state.matches('success')) {
    return <GraphNode elkNode={state.context.elkGraph as any} />;
  }

  return null;
};
