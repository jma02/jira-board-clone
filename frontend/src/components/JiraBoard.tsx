'use client';

import { useState, useEffect, useMemo } from 'react';
import config, { isDevelopment } from '@/config';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type DropAnimation = typeof defaultDropAnimation;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  name?: string; // Add name property for compatibility
}

interface WorkOrder {
  id: number;
  createdById: number;
  createdAtTime: string;
  completedAtTime: string | null;
  assignedToId: number | null;
  canceled: boolean;
  active: boolean;
  complete: boolean;
  description: string;
  stage: number;
  assignedTo: User | null;
  createdBy: User;
  user?: User; // Add optional user property for compatibility
}

interface Stage {
  id: number;
  name: string;
  color: string;
  bgColor: string;
  items: WorkOrder[];
}

const STAGES = [
  { id: 0, name: 'Backlog', color: '#5E6C84', bgColor: '#DFE1E6' },
  { id: 1, name: 'Unassigned', color: '#42526E', bgColor: '#DFE8FF' },
  { id: 2, name: 'In Progress', color: '#974F0C', bgColor: '#FFEBD1' },
  { id: 3, name: 'In Review', color: '#0052CC', bgColor: '#DEEBFF' },
  { id: 4, name: 'Completed', color: '#006644', bgColor: '#E3FCEF' },
];

// Format date to a readable format
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get initials from user name
const getInitials = (user: User | null): string => {
  if (!user) return '?';
  const name = user.name || `${user.firstName} ${user.lastName}`.trim();
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const JiraBoard = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCardStage, setNewCardStage] = useState<number | null>(null);
  const [newCardDescription, setNewCardDescription] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);

  // Fetch work orders from the API
  useEffect(() => {
    const fetchWorkOrders = async () => {
      const apiUrl = `${config.apiUrl}/api/WorkOrder`;
      try {
        if (isDevelopment()) {
          console.log('Fetching work orders from:', apiUrl);
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch work orders. Status:', response.status, 'Response:', errorText);
          throw new Error(`Failed to fetch work orders: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched work orders:', data);
        setWorkOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  // Set up sensors for DnD with better configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px tolerance before drag starts
        delay: 100, // 100ms delay before drag starts
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter work orders based on search query
  const filteredWorkOrders = useMemo(() => {
    if (!searchQuery.trim()) return workOrders;
    const query = searchQuery.toLowerCase();
    return workOrders.filter(wo => 
      wo.description.toLowerCase().includes(query) ||
      (wo.assignedTo && (
        wo.assignedTo.firstName.toLowerCase().includes(query) ||
        wo.assignedTo.lastName.toLowerCase().includes(query)
      ))
    );
  }, [workOrders, searchQuery]);
  
  // Memoize the work orders by stage
  const workOrdersByStage = useMemo(() => {
    return STAGES.map(stage => ({
      ...stage,
      items: filteredWorkOrders.filter(wo => wo.stage === stage.id)
    }));
  }, [filteredWorkOrders]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const workOrderId = active.id.toString().replace('workorder-', '');
    const targetStageId = parseInt(over.id.toString().replace('stage-', ''));

    if (isNaN(targetStageId)) {
      setActiveId(null);
      return;
    }

    // Find the work order being dragged
    const workOrder = workOrders.find(wo => wo.id === parseInt(workOrderId));
    if (!workOrder || workOrder.stage === targetStageId) {
      setActiveId(null);
      return;
    }

    // Optimistically update the UI
    const updatedWorkOrder = { 
      ...workOrder, 
      stage: targetStageId,
      complete: targetStageId === 4, // Completed
      active: targetStageId === 2 || targetStageId === 3, // In Progress or In Review
      canceled: false,
      createdById: 1
    };
    
    setWorkOrders(prev => 
      prev.map(wo => wo.id === workOrder.id ? updatedWorkOrder : wo)
    );
    setActiveId(null);

    // Update the backend
    try {
      const response = await fetch(`${config.apiUrl}/api/WorkOrder/${workOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedWorkOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to update work order');
      }
    } catch (err) {
      console.error('Error updating work order:', err);
      // Revert the optimistic update
      setWorkOrders(prev => 
        prev.map(wo => wo.id === workOrder.id ? workOrder : wo)
      );
      setError('Failed to update work order');
    }
  };

  // Handle adding a new card
  const handleAddCard = async (stageId: number) => {
    if (!newCardDescription.trim()) {
      setNewCardStage(null);
      setIsAddingCard(false);
      return;
    }

    const newWorkOrder = {
      description: newCardDescription,
      stage: stageId,
      complete: false,
      active: false,
      canceled: false,
      createdById: 1,
      assignedTo: null,
      assignedToId: null,
      createdAtTime: new Date().toISOString(),
      completedAtTime: null
    };

    try {
      const response = await fetch(`${config.apiUrl}/api/WorkOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to create work order');
      }

      const createdWorkOrder = await response.json();
      setWorkOrders(prev => [...prev, createdWorkOrder]);
      setNewCardDescription('');
      setNewCardStage(null);
      setIsAddingCard(false);
    } catch (err) {
      console.error('Error creating work order:', err);
      setError('Failed to create work order');
    }
  };

  const handleStartAddCard = (stageId: number) => {
    setNewCardStage(stageId);
    setIsAddingCard(true);
  };

  const handleCancelAdd = () => {
    setNewCardStage(null);
    setNewCardDescription('');
    setIsAddingCard(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, stageId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCard(stageId);
    } else if (e.key === 'Escape') {
      handleCancelAdd();
    }
  };

  // Render the work order item in the overlay
  const renderWorkOrderOverlay = () => {
    const workOrder = workOrders.find(wo => `workorder-${wo.id}` === activeId);
    if (!workOrder) return null;
    
    return (
      <div className="bg-white rounded border border-blue-300 shadow-xl opacity-90 cursor-grabbing w-64 transform scale-105">
        <div className="p-3">
          <div className="font-medium text-gray-800 line-clamp-2">
            {workOrder.description}
          </div>
        </div>
      </div>
    );
  };

  // Handle delete work order
  const handleDeleteWorkOrder = async () => {
    if (!workOrderToDelete) return;

    try {
      const response = await fetch(`${config.apiUrl}/api/WorkOrder/${workOrderToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete work order');
      }

      // Remove the work order from the state
      setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderToDelete.id));
      setShowDeleteModal(false);
      setWorkOrderToDelete(null);
    } catch (err) {
      console.error('Error deleting work order:', err);
      setError('Failed to delete work order');
    }
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, workOrder: WorkOrder) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete button clicked for work order:', workOrder.id);
    setWorkOrderToDelete(workOrder);
    setShowDeleteModal(true);
  };

  // Drop animation configuration
  const dropAnimation: DropAnimation = {
    ...defaultDropAnimation,
    duration: 200,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 0.99)',
  };
  
  // Drag overlay styles
  const dragOverlayStyles = {
    opacity: 0.5,
  };

  // Log any work orders with stages not in our STAGES array
  const invalidStages = [...new Set(workOrders.map(wo => wo.stage))]
    .filter(stageId => !STAGES.some(s => s.id === stageId));
    
  if (invalidStages.length > 0) {
    console.warn('Work orders found with stages not in STAGES array:', invalidStages);
  }

  // Add a small delay before enabling drag to prevent accidental drags
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDragEnabled(true);
    }, 500); // Small delay to prevent accidental drags on page load
    
    return () => clearTimeout(timer);
  }, []);
  
  // Create a SortableItem component for better performance
  interface SortableItemProps {
    workOrder: WorkOrder;
    isDragging?: boolean;
    onDeleteClick: (e: React.MouseEvent, workOrder: WorkOrder) => void;
  }
  
  const SortableItem = ({ workOrder, isDragging, onDeleteClick }: SortableItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ 
      id: `workorder-${workOrder.id}`,
      data: { type: 'workorder', workOrder }
    });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition: transition || undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1 : 'auto',
      position: 'relative' as const,
    };

    const stage = STAGES.find(s => s.id === workOrder.stage) || STAGES[0];
    const isCompleted = workOrder.complete;
    const isCanceled = workOrder.canceled;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow mb-2 group ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
        {...attributes}
      >
        {/* Delete Button - Positioned absolutely in top-right corner */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(e, workOrder);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 z-20 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          title="Delete work order"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-3">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-2 pr-4">
            <span className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">
              {workOrder.description}
            </span>
            {workOrder.assignedTo && (
              <div 
                className="atlaskit-avatar bg-blue-100 text-blue-700 text-xs flex-shrink-0 ml-2"
                title={`${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}`}
              >
                {getInitials(workOrder.assignedTo)}
              </div>
            )}
          </div>
          
          {/* Card Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${stage.bgColor}80`, 
                  color: stage.color,
                  border: `1px solid ${stage.color}40`
                }}
              >
                {stage.name}
              </div>
              {isCompleted && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
              {isCanceled && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Canceled
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              #{workOrder.id}
            </span>
          </div>
        </div>
        <div 
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseLeave={(e) => e.currentTarget.blur()}
          onBlur={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              e.currentTarget.focus();
            }
          }}
          tabIndex={-1}
          {...listeners}
        />
      </div>
    );
  };

  // Create a SortableStage component for each column
  interface SortableStageProps {
    stage: Stage & { items: WorkOrder[] };
    onAddClick: (stageId: number) => void;
    onCancelAdd: () => void;
    onKeyDown: (e: React.KeyboardEvent, stageId: number) => void;
    onAddCard: (stageId: number) => void;
    newCardStage: number | null;
    newCardDescription: string;
    setNewCardDescription: (value: string) => void;
  }
  
  const SortableStage = ({ 
    stage, 
    onAddClick, 
    onCancelAdd, 
    onKeyDown, 
    onAddCard,
    newCardStage,
    newCardDescription,
    setNewCardDescription
  }: SortableStageProps) => {
    const { id, name, items, color, bgColor } = stage;
    const itemIds = items.map(item => `workorder-${item.id}`);
    const { setNodeRef } = useSortable({
      id: `stage-${id}`,
      data: { type: 'stage', stage: id }
    });

    return (
      <div 
        ref={setNodeRef}
        className="flex-shrink-0 w-72"
      >
        <div className="bg-white rounded-lg shadow">
          <div 
            className="p-3 border-b border-gray-200 flex justify-between items-center"
            style={{ borderTop: `3px solid ${color}` }}
          >
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: color }}
              />
              <h2 className="font-medium text-gray-800">{name}</h2>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {items.length}
            </span>
          </div>
          <div className="p-3 min-h-[100px]">
            <SortableContext 
              items={itemIds} 
              strategy={verticalListSortingStrategy}
            >
              {items.map((workOrder) => (
                <SortableItem 
                  key={workOrder.id} 
                  workOrder={workOrder} 
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </SortableContext>
            <div className="mt-2">
              {newCardStage === id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a title for this card..."
                    value={newCardDescription}
                    onChange={(e) => setNewCardDescription(e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, id)}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAddCard(id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add card
                    </button>
                    <button
                      onClick={onCancelAdd}
                      className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer flex items-center"
                  onClick={() => onAddClick(id)}
                >
                  <span className="mr-1">+</span> Add a card
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Modal
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 pt-20">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Work Order</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this work order? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setWorkOrderToDelete(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteWorkOrder}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 overflow-auto">
        {loading && <div>Loading work orders...</div>}
        {error && <div className="text-red-500 mb-4">Error: {error}</div>}
        {showDeleteModal && <DeleteConfirmationModal />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jira Board Clone</h1>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {workOrdersByStage.map((stage) => (
            <div key={stage.id} className="droppable" data-stage-id={stage.id}>
              <SortableStage 
                stage={stage}
                onAddClick={handleStartAddCard}
                onCancelAdd={handleCancelAdd}
                onKeyDown={handleKeyDown}
                onAddCard={handleAddCard}
                newCardStage={newCardStage}
                newCardDescription={newCardDescription}
                setNewCardDescription={setNewCardDescription}
              />
            </div>
          ))}
        </div>
        
        <DragOverlay 
          dropAnimation={{
            ...dropAnimation,
            duration: 150, // Faster drop animation
          }}
          style={{ opacity: 0.5 }}
          // modifiers={[restrictToWindowEdges]}
        >
          {activeId && activeId.startsWith('workorder-') && renderWorkOrderOverlay()}
        </DragOverlay>
      </DndContext>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && <DeleteConfirmationModal />}
    </div>
  );
};

export default JiraBoard;
