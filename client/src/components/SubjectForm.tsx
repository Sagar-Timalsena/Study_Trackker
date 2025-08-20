import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubjectWithStats, InsertSubject } from "@shared/schema";

interface SubjectFormProps {
  subject?: SubjectWithStats | null;
  onSubmit: (data: InsertSubject) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const iconOptions = [
  { value: "fas fa-book", label: "Book", icon: "fas fa-book" },
  { value: "fas fa-calculator", label: "Calculator", icon: "fas fa-calculator" },
  { value: "fas fa-atom", label: "Atom", icon: "fas fa-atom" },
  { value: "fas fa-flask", label: "Flask", icon: "fas fa-flask" },
  { value: "fas fa-microscope", label: "Microscope", icon: "fas fa-microscope" },
  { value: "fas fa-globe", label: "Globe", icon: "fas fa-globe" },
  { value: "fas fa-language", label: "Language", icon: "fas fa-language" },
  { value: "fas fa-paint-brush", label: "Art", icon: "fas fa-paint-brush" },
  { value: "fas fa-music", label: "Music", icon: "fas fa-music" },
  { value: "fas fa-dumbbell", label: "Sports", icon: "fas fa-dumbbell" },
  { value: "fas fa-laptop-code", label: "Code", icon: "fas fa-laptop-code" },
  { value: "fas fa-chart-line", label: "Business", icon: "fas fa-chart-line" },
];

const colorOptions = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#EC4899", label: "Pink" },
  { value: "#84CC16", label: "Lime" },
  { value: "#F97316", label: "Orange" },
  { value: "#6366F1", label: "Indigo" },
];

export default function SubjectForm({ subject, onSubmit, onCancel, isLoading = false }: SubjectFormProps) {
  const [formData, setFormData] = useState<InsertSubject>({
    name: "",
    description: "",
    weeklyGoal: "10.0",
    color: "#3B82F6",
    icon: "fas fa-book",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        description: subject.description || "",
        weeklyGoal: subject.weeklyGoal,
        color: subject.color,
        icon: subject.icon,
        isActive: subject.isActive,
      });
    }
  }, [subject]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    }

    if (!formData.weeklyGoal || Number(formData.weeklyGoal) <= 0) {
      newErrors.weeklyGoal = "Weekly goal must be greater than 0";
    }

    if (Number(formData.weeklyGoal) > 168) {
      newErrors.weeklyGoal = "Weekly goal cannot exceed 168 hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof InsertSubject, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subject Name */}
      <div>
        <Label htmlFor="name">Subject Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g., Advanced Mathematics"
          className={`mt-2 ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Brief description of the subject..."
          rows={3}
          className="mt-2"
        />
      </div>

      {/* Weekly Goal */}
      <div>
        <Label htmlFor="weeklyGoal">Weekly Study Goal (hours) *</Label>
        <Input
          id="weeklyGoal"
          type="number"
          step="0.5"
          min="0.5"
          max="168"
          value={formData.weeklyGoal}
          onChange={(e) => handleInputChange("weeklyGoal", e.target.value)}
          className={`mt-2 ${errors.weeklyGoal ? "border-red-500" : ""}`}
        />
        {errors.weeklyGoal && (
          <p className="text-sm text-red-500 mt-1">{errors.weeklyGoal}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">How many hours per week do you want to study this subject?</p>
      </div>

      {/* Icon Selection */}
      <div>
        <Label>Icon</Label>
        <Select value={formData.icon} onValueChange={(value) => handleInputChange("icon", value)}>
          <SelectTrigger className="mt-2">
            <SelectValue>
              <div className="flex items-center">
                <i className={`${formData.icon} mr-2`}></i>
                <span>{iconOptions.find(opt => opt.value === formData.icon)?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <i className={`${option.icon} mr-2`}></i>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Selection */}
      <div>
        <Label>Color Theme</Label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange("color", option.value)}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                formData.color === option.value 
                  ? "border-gray-900 ring-2 ring-gray-300" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
            >
              {formData.color === option.value && (
                <i className="fas fa-check text-white"></i>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {subject ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <i className={`fas ${subject ? "fa-save" : "fa-plus"} mr-2`}></i>
              {subject ? "Update Subject" : "Create Subject"}
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Preview</Label>
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
            style={{ backgroundColor: `${formData.color}20` }}
          >
            <i 
              className={`${formData.icon}`}
              style={{ color: formData.color }}
            ></i>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {formData.name || "Subject Name"}
            </p>
            <p className="text-sm text-gray-500">
              {formData.description || "No description"} • {formData.weeklyGoal}h/week goal
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
