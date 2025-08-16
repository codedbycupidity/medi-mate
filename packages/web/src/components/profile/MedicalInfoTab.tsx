import React from 'react'
import { Heart, AlertCircle, Activity } from 'lucide-react'

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: any
  medicalInfo?: {
    bloodType?: string
    allergies?: string[]
    conditions?: string[]
    emergencyContact?: {
      name?: string
      phone?: string
      relationship?: string
    }
  }
  preferences?: any
  createdAt: string
  updatedAt: string
}

interface MedicalInfoTabProps {
  profile: UserProfile
  editedProfile: UserProfile
  editing: boolean
  onProfileChange: (updatedProfile: UserProfile) => void
}

export const MedicalInfoTab: React.FC<MedicalInfoTabProps> = ({
  profile,
  editedProfile,
  editing,
  onProfileChange
}) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Medical Information</h2>
      <p className="text-muted-foreground mb-6">Important health information for your safety</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            <Heart className="inline h-4 w-4 mr-2" />
            Blood Type
          </label>
          <select
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.medicalInfo?.bloodType || ''}
            onChange={(e) => onProfileChange({
              ...editedProfile,
              medicalInfo: { ...editedProfile.medicalInfo, bloodType: e.target.value }
            })}
            disabled={!editing}
          >
            <option value="">Select blood type</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          Allergies
        </label>
        <textarea
          className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
          placeholder="List any allergies (one per line)"
          value={editedProfile.medicalInfo?.allergies?.join('\n') || ''}
          onChange={(e) => onProfileChange({
            ...editedProfile,
            medicalInfo: {
              ...editedProfile.medicalInfo,
              allergies: e.target.value.split('\n').filter(a => a.trim())
            }
          })}
          disabled={!editing}
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <Activity className="inline h-4 w-4 mr-2" />
          Medical Conditions
        </label>
        <textarea
          className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
          placeholder="List any medical conditions (one per line)"
          value={editedProfile.medicalInfo?.conditions?.join('\n') || ''}
          onChange={(e) => onProfileChange({
            ...editedProfile,
            medicalInfo: {
              ...editedProfile.medicalInfo,
              conditions: e.target.value.split('\n').filter(c => c.trim())
            }
          })}
          disabled={!editing}
        />
      </div>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-medium mb-4">Emergency Contact</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Contact Name</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.name || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    name: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Phone</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.phone || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    phone: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Relationship</label>
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={editedProfile.medicalInfo?.emergencyContact?.relationship || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                medicalInfo: {
                  ...editedProfile.medicalInfo,
                  emergencyContact: {
                    ...editedProfile.medicalInfo?.emergencyContact,
                    relationship: e.target.value
                  }
                }
              })}
              disabled={!editing}
              placeholder="Spouse, Parent, etc."
            />
          </div>
        </div>
      </div>
    </div>
  )
}