import React from 'react'
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react'

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  medicalInfo?: any
  preferences?: any
  createdAt: string
  updatedAt: string
}

interface PersonalInfoTabProps {
  profile: UserProfile
  editedProfile: UserProfile
  editing: boolean
  onProfileChange: (updatedProfile: UserProfile) => void
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profile,
  editedProfile,
  editing,
  onProfileChange
}) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-1">Personal Information</h2>
      <p className="text-muted-foreground mb-6">Your basic account details</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">
            <User className="inline h-4 w-4 mr-2" />
            Full Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.name}
            onChange={(e) => onProfileChange({ ...editedProfile, name: e.target.value })}
            disabled={!editing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Mail className="inline h-4 w-4 mr-2" />
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.email}
            onChange={(e) => onProfileChange({ ...editedProfile, email: e.target.value })}
            disabled={!editing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Phone className="inline h-4 w-4 mr-2" />
            Phone
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.phone || ''}
            onChange={(e) => onProfileChange({ ...editedProfile, phone: e.target.value })}
            disabled={!editing}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            <Calendar className="inline h-4 w-4 mr-2" />
            Date of Birth
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={editedProfile.dateOfBirth || ''}
            onChange={(e) => onProfileChange({ ...editedProfile, dateOfBirth: e.target.value })}
            disabled={!editing}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          <MapPin className="inline h-4 w-4 mr-2" />
          Address
        </label>
        <div className="grid gap-3">
          <input
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            placeholder="Street Address"
            value={editedProfile.address?.street || ''}
            onChange={(e) => onProfileChange({
              ...editedProfile,
              address: { ...editedProfile.address, street: e.target.value }
            })}
            disabled={!editing}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="City"
              value={editedProfile.address?.city || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                address: { ...editedProfile.address, city: e.target.value }
              })}
              disabled={!editing}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="State"
              value={editedProfile.address?.state || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                address: { ...editedProfile.address, state: e.target.value }
              })}
              disabled={!editing}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="ZIP Code"
              value={editedProfile.address?.zipCode || ''}
              onChange={(e) => onProfileChange({
                ...editedProfile,
                address: { ...editedProfile.address, zipCode: e.target.value }
              })}
              disabled={!editing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}