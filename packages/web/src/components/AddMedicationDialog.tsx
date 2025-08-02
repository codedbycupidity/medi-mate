import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@medimate/components'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@medimate/components'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface AddMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const UNITS = [
  { value: 'mg', label: 'mg' },
  { value: 'g', label: 'g' },
  { value: 'mcg', label: 'mcg' },
  { value: 'ml', label: 'ml' },
  { value: 'drops', label: 'drops' },
  { value: 'tablets', label: 'tablets' },
  { value: 'capsules', label: 'capsules' },
  { value: 'injections', label: 'injections' },
]

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'four_times_daily', label: 'Four Times Daily' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function AddMedicationDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddMedicationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    unit: 'mg',
    frequency: 'once_daily',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    quantity: '',
    instructions: '',
    prescribedBy: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.dosage) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      await api.post('/medications', {
        ...formData,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        startDate: new Date(formData.startDate),
      })
      
      toast.success('Medication added successfully')
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: '',
        dosage: '',
        unit: 'mg',
        frequency: 'once_daily',
        times: ['08:00'],
        startDate: new Date().toISOString().split('T')[0],
        quantity: '',
        instructions: '',
        prescribedBy: '',
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...formData.times]
    newTimes[index] = value
    setFormData({ ...formData, times: newTimes })
  }

  const addTimeSlot = () => {
    setFormData({ ...formData, times: [...formData.times, '12:00'] })
  }

  const removeTimeSlot = (index: number) => {
    const newTimes = formData.times.filter((_, i) => i !== index)
    setFormData({ ...formData, times: newTimes })
  }

  // Determine number of time slots based on frequency
  const getTimeSlotCount = () => {
    switch (formData.frequency) {
      case 'once_daily':
        return 1
      case 'twice_daily':
        return 2
      case 'three_times_daily':
        return 3
      case 'four_times_daily':
        return 4
      default:
        return 1
    }
  }

  // Update times array when frequency changes
  React.useEffect(() => {
    const slotCount = getTimeSlotCount()
    const currentCount = formData.times.length
    
    if (currentCount < slotCount) {
      // Add time slots
      const newTimes = [...formData.times]
      for (let i = currentCount; i < slotCount; i++) {
        newTimes.push(`${8 + (i * 4)}:00`.padStart(5, '0'))
      }
      setFormData({ ...formData, times: newTimes })
    } else if (currentCount > slotCount && formData.frequency !== 'as_needed') {
      // Remove extra time slots
      setFormData({ ...formData, times: formData.times.slice(0, slotCount) })
    }
  }, [formData.frequency])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Add a new medication to your tracking list
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Aspirin"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 100"
                  value={formData.dosage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dosage: e.target.value })}
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
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: string) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formData.frequency !== 'as_needed' && (
              <div className="grid gap-2">
                <Label>Reminder Times</Label>
                <div className="space-y-2">
                  {formData.times.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange(index, e.target.value)}
                        className="flex-1"
                      />
                      {formData.frequency === 'as_needed' && formData.times.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTimeSlot(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.frequency === 'as_needed' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTimeSlot}
                      className="w-full"
                    >
                      Add Time Slot
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (optional)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="prescribedBy">Prescribed By (optional)</Label>
              <Input
                id="prescribedBy"
                placeholder="e.g., Dr. Smith"
                value={formData.prescribedBy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, prescribedBy: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions (optional)</Label>
              <Input
                id="instructions"
                placeholder="e.g., Take with food"
                value={formData.instructions}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Medication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}