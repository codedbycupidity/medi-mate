import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/AppNavigator';

type MedicationDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'MedicationDetail'
>;

interface Props {
  route: MedicationDetailScreenRouteProp;
}

function MedicationDetailScreen({route}: Props) {
  const {medicationId} = route.params;

  // TODO: Fetch medication details based on medicationId
  const medication = {
    id: medicationId,
    name: 'Aspirin',
    dosage: '100mg',
    frequency: 'Once daily',
    instructions: 'Take with food',
    sideEffects: 'May cause stomach upset',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Medication Name</Text>
        <Text style={styles.value}>{medication.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dosage</Text>
        <Text style={styles.value}>{medication.dosage}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Frequency</Text>
        <Text style={styles.value}>{medication.frequency}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Instructions</Text>
        <Text style={styles.value}>{medication.instructions}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Side Effects</Text>
        <Text style={styles.value}>{medication.sideEffects}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Start Date</Text>
        <Text style={styles.value}>{medication.startDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>End Date</Text>
        <Text style={styles.value}>{medication.endDate}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Medication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Medication</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicationDetailScreen;