"use client";

import { useEffect, useState, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
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

  lines.forEach((line) => {
    const values = line.split(",").map((v) => v.trim());
        if (values.length < 2) return;

    const [level1, ...rest] = values;
    const value = rest.slice(0, -1).join(", ");
         const count = parseInt(rest[rest.length-1]) || undefined;

    let currentNode = root;

    const levels = [level1, ...rest]

      levels.forEach((levelN, index) => {

          const existingChild = currentNode.children.find(child => child.label === levelN)

          if(existingChild) {
              currentNode = existingChild
          } else {
              const id = `levelN-${levelN}-${index}-${generateUniqueId()}`;
              const newChild: DataNode = {
                  id,
        label: levelN,
                  value: index === levels.length - 2 ? value : undefined,
                  count: index === levels.length - 1 ? count : undefined,
      children: [],
              }
              currentNode.children.push(newChild)
              currentNode = newChild
          }


      })


  });


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


  console.log(`createNodesAndEdges: Processing node ${dataNode.label}, id: ${dataNode.id}, level: ${level}`);
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
    console.log(`createNodesAndEdges: Created node ${dataNode.label}, id: ${dataNode.id}, current nodes:`, nodes);


  if (dataNode.children && dataNode.children.length > 0) {
    let childrenY = currentY; // Initialize child vertical position
    dataNode.children.forEach((child) => {
      const subtreeHeight = calculateSubtreeHeight(child); // Calculate height to avoid overlaps
        console.log(
            `createNodesAndEdges: Processing child: ${child.label}, id: ${child.id}, parent: ${dataNode.id}, level: ${
                level + 1
            }`
        );

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


        childrenY += subtreeHeight ; // Adjust the `y` for the next child
    });



      dataNode.children.forEach((child) => {
          const newEdge: Edge = {
              id: `edge-${dataNode.id}-${child.id}`,
              source: dataNode.id,
              target: child.id,
              markerEnd: { type: MarkerType.ArrowClosed },
              animated:true

          };
          edges.push(newEdge);
          console.log(
              `createNodesAndEdges: Created edge: ${newEdge.id}, source: ${newEdge.source}, target: ${newEdge.target}, current edges:`,
              edges
          );
      });

  }
    verticalPositions[level] = currentY + (dataNode.children?.length * VERTICAL_SPACING || VERTICAL_SPACING);

  console.log(
    `createNodesAndEdges: Finished processing node ${dataNode.label}, id: ${dataNode.id}, level: ${level}, returning nodes:`,
    nodes,
    "edges:",
    edges
  );

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
    const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

     useEffect(() => {
    if (reactFlowWrapper.current) {
        setReactFlowInstance(reactFlowWrapper.current);
    }
  }, []);


  useEffect(() => {
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
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
          if (reactFlowInstance) {
              reactFlowInstance.fitView() // Fit view once edges are loaded
          }
          setLoading(false);
        }, 0);


      };
      reader.readAsText(file);
    }
  }, [file, setNodes, setEdges, reactFlowInstance]);

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