import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Material } from '../types';
import { ReactFlow, Controls, Background, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft } from 'lucide-react';

export default function MindMapViewer() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    async function load() {
      if (!materialId) return;
      const ref = doc(db, 'materials', materialId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        const mat = docSnap.data() as Material;
        setMaterial(mat);

        if (mat.mindmap) {
          // Layout nodes in a basic circle or grid
          const radius = 250;
          const newNodes: Node[] = mat.mindmap.nodes.map((n, i) => {
            const angle = (i / mat.mindmap!.nodes.length) * 2 * Math.PI;
            const isCenter = i === 0;
            return {
              id: n.id,
              position: isCenter ? { x: 0, y: 0 } : { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
              data: { label: n.label },
              style: {
                background: isCenter ? '#EFF6FF' : '#ffffff',
                color: isCenter ? '#1D4ED8' : '#334155',
                border: isCenter ? '2px solid #3B82F6' : '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '12px 20px',
                fontWeight: isCenter ? 'bold' : '500',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                width: 180,
                textAlign: 'center'
              }
            };
          });
          const newEdges: Edge[] = mat.mindmap.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            animated: true,
            style: { stroke: '#94A3B8', strokeWidth: 2 }
          }));

          setNodes(newNodes);
          setEdges(newEdges);
        }
      }
    }
    load();
  }, [materialId]);

  if (!material) return <div className="p-8">Carregando mapa mental...</div>;

  return (
    <div className="h-[80vh] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center space-x-4">
        <button onClick={() => navigate('/study')} className="p-2 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-slate-800 tracking-tight">Mapa Mental</h2>
          <p className="text-sm text-slate-500">{material.title}</p>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="#E2E8F0" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
