import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button
} from '@medimate/components'
import { Button as UIButton } from './ui/button'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Plus, X, Clock } from 'lucide-react'

interface EditMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medication: any | null
  onSuccess?: () => void
}

export function EditMedicationDialog({
  open,
  onOpenChange,
  medication,
  onSuccess
}: EditMedicationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    unit: 'mg',
    frequency: 'once_daily',
    times: [] as string[],
    quantity: '',
    prescribedBy: '',
    instructions: '',
    refillReminder: false,
    refillThreshold: 10
  })

  // Reset form data when medication changes
  useEffect(() => {
    if (medication && open) {
      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        unit: medication.unit || 'mg',
        frequency: medication.frequency || 'once_daily',
        times: medication.times || ['09:00'],
        quantity: medication.quantity?.toString() || '',
        prescribedBy: medication.prescribedBy || '',
        instructions: medication.instructions || '',
        refillReminder: medication.refillReminder || false,
        refillThreshold: medication.refillThreshold || 10
      })
    }
  }, [medication, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medication) return

    try {
      setLoading(true)
      
      const submitData = {
        ...formData,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      }

      const medicationId = medication._id || medication.id
      await api.put(`/medications/${medicationId}`, submitData)
      
      toast.success('Medication updated successfully')
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update medication'
      toast.error(errorMessage)
      console.error('Error updating medication:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!medication) return
    
    if (!window.confirm('Are you sure you want to delete this medication? This will also delete all associated reminders.')) {
      return
    }

    try {
      setLoading(true)
      const medicationId = medication._id || medication.id
      await api.delete(`/medications/${medicationId}`)
      
      toast.success('Medication deleted successfully')
      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete medication'
      toast.error(errorMessage)
      console.error('Error deleting medication:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '09:00']
    })
  }

  const removeTimeSlot = (index: number) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    })
  }

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...formData.times]
    newTimes[index] = value
    setFormData({
      ...formData,
      times: newTimes
    })
  }

  const handleFrequencyChange = (value: string) => {
    setFormData({
      ...formData,
      frequency: value,
      // Keep existing times unless switching to/from as_needed
      times: value === 'as_needed' ? [] : formData.times
    })
  }

  if (!open || !medication) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>
              Update the details for {medication.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Medication Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Aspirin, Metformin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Dosage and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  type="text"
                  placeholder="e.g., 100"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: string) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                    <SelectItem value="tablets">tablets</SelectItem>
                    <SelectItem value="capsules">capsules</SelectItem>
                    <SelectItem value="drops">drops</SelectItem>
                    <SelectItem value="puffs">puffs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequency */}
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">Once Daily</SelectItem>
                  <SelectItem value="twice_daily">Twice Daily</SelectItem>
                  <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                  <SelectItem value="four_times_daily">Four Times Daily</SelectItem>
                  <SelectItem value="as_needed">As Needed</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Times */}
            {formData.frequency !== 'as_needed' && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reminder Times (Optional)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to let AI suggest times based on instructions
                    </p>
                  </div>
                  <UIButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time
                  </UIButton>
                </div>
                {formData.times.length > 0 ? (
                  <div className="space-y-2">
                    {formData.times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => updateTimeSlot(index, e.target.value)}
                        />
                        <UIButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <X className="h-4 w-4" />
                        </UIButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No specific times set. AI will suggest optimal times based on your instructions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (Optional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="refillThreshold">Refill Alert When</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="refillThreshold"
                    type="number"
                    value={formData.refillThreshold}
                    onChange={(e) => setFormData({ ...formData, refillThreshold: parseInt(e.target.value) || 10 })}
                    disabled={!formData.quantity}
                  />
                  <span className="text-sm text-muted-foreground">pills left</span>
                </div>
              </div>
            </div>

            {/* Prescriber */}
            <div className="grid gap-2">
              <Label htmlFor="prescribedBy">Prescribed By (Optional)</Label>
              <Input
                id="prescribedBy"
                placeholder="e.g., Dr. Smith"
                value={formData.prescribedBy}
                onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
              />
            </div>

            {/* Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="instructions">Special Instructions (Optional)</Label>
              <textarea
                id="instructions"
                placeholder="e.g., Take with food, avoid alcohol"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <UIButton
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Medication
            </UIButton>
            <div className="flex gap-2">
              <UIButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </UIButton>
              <UIButton type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </UIButton>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}