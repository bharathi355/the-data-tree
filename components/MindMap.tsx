"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";

interface MindMapProps {
  file: File | null;
}

interface DataNode {
  id: string;
  label: string;
  children: DataNode[];
    value?: string;
  count?: number;
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function processCSVData(lines: string[]): DataNode {
  const root: DataNode = {
    id: `root-${generateUniqueId()}`,
    label: "Data",
    children: [],
  };

  for (const line of lines) {
    const values = line.split(",").map((v) => v.trim());
    if (values.length < 2) continue;

    const [level1, ...rest] = values;
    const value = rest.slice(0, -1).join(", ");
         const count = parseInt(rest[rest.length-1]) || undefined;

    let currentNode = root;
      const levels = [level1, ...rest];

      // for (const [index, levelN] of levels.entries()) {
      for (const [index, levelN] of Array.from(levels.entries())) {
          let existingChild = currentNode.children.find(child => child.label === levelN);

          if(existingChild) {
              currentNode = existingChild;
          } else {
              const id = `levelN-${levelN}-${index}-${generateUniqueId()}`;
              const newChild: DataNode = {
                  id,
        label: levelN,
                  value: index === levels.length - 2 ? value : undefined,
                  count: index === levels.length - 1 ? count : undefined,
      children: [],
              };
              currentNode.children.push(newChild);
              currentNode = newChild;
              }
          }

  }


  return root;
}

function createNodesAndEdges(
  dataNode: DataNode,
  x: number,
  y: number,
  level: number = 0,
  nodes: Node[] = [],
  edges: Edge[] = [],
  verticalPositions: { [level: number]: number } = {}
): { nodes: Node[]; edges: Edge[] } {
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 150;


    if (verticalPositions[level] === undefined) {
    verticalPositions[level] = y;
  }
  let currentY = verticalPositions[level];

    const newNode: Node = {
      id: dataNode.id,
        data: { label: dataNode.label, value: dataNode.value, count: dataNode.count },
      position: { x, y: currentY },
  };

  nodes.push(newNode);


  if (dataNode.children && dataNode.children.length > 0) {
        let childrenY = currentY;
        for (const child of dataNode.children) {
            const subtreeHeight = calculateSubtreeHeight(child);


      const { nodes: childNodes, edges: childEdges } = createNodesAndEdges(
        child,
        x + HORIZONTAL_SPACING,
        childrenY,
        level + 1,
        [],
        [],
        verticalPositions
      );
      nodes.push(...childNodes);
      edges.push(...childEdges);


            childrenY += subtreeHeight ;
        }


        for (const child of dataNode.children) {
          const newEdge: Edge = {
              id: `edge-${dataNode.id}-${child.id}`,
              source: dataNode.id,
              target: child.id,
              markerEnd: { type: MarkerType.ArrowClosed },
                animated: true,
          };
          edges.push(newEdge);
        }
  }
    verticalPositions[level] = currentY + (dataNode.children?.length * VERTICAL_SPACING || VERTICAL_SPACING);


    return { nodes, edges };


  function calculateSubtreeHeight(node: DataNode): number {
        let height = 1;
        if (node.children && node.children.length > 0) {
            height += node.children.reduce((acc, child) => {
                return acc + calculateSubtreeHeight(child);
            }, 0);
        }

        return height * VERTICAL_SPACING;
    }
}




export default function MindMap({ file }: MindMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

     useEffect(() => {
    if (reactFlowWrapper.current) {
        // setReactFlowInstance(reactFlowWrapper.current);
    }
  }, []);

    const processFile = useCallback(async (file: File) => {
      setLoading(true);
        try {
            const text = await file.text();
        const lines = text.split("\n");
        const hierarchicalData = processCSVData(lines);
        const { nodes: initialNodes, edges: initialEdges } = createNodesAndEdges(
          hierarchicalData,
          50,
          50
        );
        setNodes(initialNodes);
        setEdges([]);

        setTimeout(() => {
          setEdges(initialEdges);
                 reactFlowInstance?.fitView(); // Fit view once edges are loaded
             }, 0);


        } catch (error) {
            console.error("Error processing file:", error);
        } finally {
          setLoading(false);
        }
    }, [setNodes, reactFlowInstance, setEdges]);


  useEffect(() => {
    if (file) {
      processFile(file);
    }
  }, [file, processFile]);



  if (!file) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Upload a CSV file to generate a mind map
        </p>
      </Card>
    );
  }

  return (
    <Card className="h-[800px] relative">
      {loading ? (
        <div className="h-full flex items-center justify-center absolute top-0 left-0 w-full h-full bg-white bg-opacity-70">
          <p className="text-muted-foreground">Generating mind map...</p>
        </div>
      ) : (
        <div ref={reactFlowWrapper} style={{ height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView={false}
          minZoom={0.1}
          maxZoom={3}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        >
          <Background />
          <Controls />
        </ReactFlow>
                </div>
      )}
    </Card>
  );
}