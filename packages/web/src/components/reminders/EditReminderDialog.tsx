import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@medimate/components'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@medimate/components'
import { Button } from '../ui/button'
import { format } from 'date-fns'
import { Reminder } from './columns'

interface EditReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder: Reminder | null
  onSave: (id: string, data: any) => Promise<void>
}

export function EditReminderDialog({
  open,
  onOpenChange,
  reminder,
  onSave,
}: EditReminderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    scheduledTime: '',
    scheduledDate: '',
    status: 'pending',
    notes: '',
    doseTaken: '',
  })

  useEffect(() => {
    if (reminder) {
      const date = new Date(reminder.scheduledTime)
      setFormData({
        scheduledTime: format(date, 'HH:mm'),
        scheduledDate: format(date, 'yyyy-MM-dd'),
        status: reminder.status,
        notes: reminder.notes || '',
        doseTaken: reminder.doseTaken || '',
      })
    }
  }, [reminder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminder) return

    try {
      setLoading(true)
      
      // Combine date and time
      const [hours, minutes] = formData.scheduledTime.split(':')
      const scheduledDateTime = new Date(formData.scheduledDate)
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      await onSave(reminder._id, {
        scheduledTime: scheduledDateTime.toISOString(),
        status: formData.status,
        notes: formData.notes || undefined,
        doseTaken: formData.doseTaken || undefined,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!reminder) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Update reminder for {reminder.medicationId.name} {reminder.medicationId.dosage}{reminder.medicationId.unit}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => setFormData({ ...formData, status: value as 'pending' | 'taken' | 'missed' | 'skipped' })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="taken">Taken</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.status === 'taken' || formData.status === 'skipped') && (
              <div className="grid gap-2">
                <Label htmlFor="doseTaken">Dose Taken (optional)</Label>
                <Input
                  id="doseTaken"
                  placeholder="e.g., Half dose, Full dose"
                  value={formData.doseTaken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, doseTaken: e.target.value })}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                placeholder="Add any notes about this reminder..."
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}