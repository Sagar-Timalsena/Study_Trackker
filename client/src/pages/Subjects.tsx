import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import SubjectCard from "@/components/SubjectCard";
import SubjectForm from "@/components/SubjectForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SubjectWithStats, InsertSubject } from "@shared/schema";

export default function Subjects() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithStats | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading, error } = useQuery<SubjectWithStats[]>({
    queryKey: ["/api/subjects"],
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: InsertSubject) => {
      return apiRequest("POST", "/api/subjects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Subject created successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSubject> }) => {
      return apiRequest("PUT", `/api/subjects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsFormOpen(false);
      setEditingSubject(null);
      toast({
        title: "Success",
        description: "Subject updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Subject deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleEditSubject = (subject: SubjectWithStats) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data: InsertSubject) => {
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data });
    } else {
      createSubjectMutation.mutate(data);
    }
  };

  if (error && isUnauthorizedError(error)) {
    return null; // Component will redirect via useEffect in parent
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subjects</h1>
          <p className="text-gray-600">Manage your study subjects and track progress.</p>
        </div>
        <Button onClick={handleAddSubject}>
          <i className="fas fa-plus mr-2"></i>
          Add Subject
        </Button>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book text-gray-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first subject to track.</p>
          <Button onClick={handleAddSubject}>
            <i className="fas fa-plus mr-2"></i>
            Add Your First Subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEditSubject}
              onDelete={handleDeleteSubject}
            />
          ))}
        </div>
      )}

      {/* Subject Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "Edit Subject" : "Add New Subject"}
            </DialogTitle>
          </DialogHeader>
          <SubjectForm
            subject={editingSubject}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSubject(null);
            }}
            isLoading={createSubjectMutation.isPending || updateSubjectMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
