import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { api } from '../../services/api'
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
} from '@medimate/components'
import { Button } from '../ui/button'
import { Calendar, Clock, Pill } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Medication {
  _id: string
  name: string
  dosage: string
  unit: string
  frequency: string
  times: string[]
}

export default function CreateReminderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateReminderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [formData, setFormData] = useState({
    medicationId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: format(new Date(), 'HH:mm'),
    notes: '',
  })

  // Fetch medications when dialog opens
  useEffect(() => {
    if (open) {
      fetchMedications()
    }
  }, [open])

  const fetchMedications = async () => {
    try {
      const response = await api.get('/medications')
      setMedications(response.data || [])
    } catch (error) {
      console.error('Error fetching medications:', error)
      toast.error('Failed to load medications')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.medicationId) {
      toast.error('Please select a medication')
      return
    }

    setLoading(true)
    
    try {
      // Combine date and time into a single ISO string
      const scheduledTime = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}:00`
      ).toISOString()

      await api.post('/reminders', {
        medicationId: formData.medicationId,
        scheduledTime,
        notes: formData.notes,
        status: 'pending'
      })

      toast.success('Reminder created successfully')
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        medicationId: '',
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledTime: format(new Date(), 'HH:mm'),
        notes: '',
      })
    } catch (error: any) {
      console.error('Error creating reminder:', error)
      toast.error(error.response?.data?.message || 'Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  const selectedMedication = medications.find(m => m._id === formData.medicationId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Reminder</DialogTitle>
            <DialogDescription>
              Manually add a medication reminder
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Medication Selection */}
            <div className="grid gap-2">
              <Label htmlFor="medication">
                <Pill className="h-4 w-4 inline mr-2" />
                Medication
              </Label>
              <Select
                value={formData.medicationId}
                onValueChange={(value: string) => 
                  setFormData({ ...formData, medicationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((med) => (
                    <SelectItem key={med._id} value={med._id}>
                      <div className="flex flex-col">
                        <span>{med.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {med.dosage} {med.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMedication && (
                <p className="text-sm text-muted-foreground">
                  Dosage: {selectedMedication.dosage} {selectedMedication.unit}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                <Calendar className="h-4 w-4 inline mr-2" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => 
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            {/* Time Selection */}
            <div className="grid gap-2">
              <Label htmlFor="time">
                <Clock className="h-4 w-4 inline mr-2" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => 
                  setFormData({ ...formData, scheduledTime: e.target.value })
                }
                required
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any special instructions or notes..."
                value={formData.notes}
                onChange={(e) => 
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
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
              {loading ? 'Creating...' : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}