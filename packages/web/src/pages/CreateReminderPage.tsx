import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { api } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@medimate/components'
import { Button } from '../components/ui/button'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@medimate/components'
import { ArrowLeft, Calendar, Clock, Pill, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Medication {
  _id: string
  name: string
  dosage: string
  unit: string
  frequency: string
  times: string[]
}

export default function CreateReminderPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])
  const [formData, setFormData] = useState({
    medicationId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: format(new Date(), 'HH:mm'),
    notes: '',
  })

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    try {
      const response = await api.get('/medications')
      // Handle the response structure from the API (same as MedicationsPage)
      const medicationsData = response.data?.medications || response.data || []
      setMedications(medicationsData)
    } catch (error) {
      console.error('Error fetching medications:', error)
      toast.error('Failed to load medications')
      setMedications([])
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
      navigate('/reminders')
    } catch (error: any) {
      console.error('Error creating reminder:', error)
      toast.error(error.response?.data?.message || 'Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  const selectedMedication = medications && Array.isArray(medications) 
    ? medications.find(m => m._id === formData.medicationId)
    : null

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/reminders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Reminder</h1>
            <p className="text-muted-foreground">Add a new medication reminder</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Details</CardTitle>
          <CardDescription>
            Set up a reminder for your medication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medication Selection */}
            <div className="space-y-2">
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
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Select a medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No medications available
                    </SelectItem>
                  ) : (
                    medications.map((med) => (
                      <SelectItem key={med._id} value={med._id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{med.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {med.dosage} {med.unit}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedMedication && (
                <div className="bg-muted/50 rounded-lg p-3 mt-2">
                  <p className="text-sm font-medium">{selectedMedication.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dosage: {selectedMedication.dosage} {selectedMedication.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Frequency: {selectedMedication.frequency}
                  </p>
                  {selectedMedication.times && selectedMedication.times.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Usual times: {selectedMedication.times.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Date and Time in a grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Date Selection */}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any special instructions or notes..."
                value={formData.notes}
                onChange={(e) => 
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/reminders')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.medicationId}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Reminder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Helper Card */}
      {medications.length === 0 && (
        <Card className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">No Medications Found</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              You need to add medications before creating reminders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/medications')}>
              Go to Medications
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}