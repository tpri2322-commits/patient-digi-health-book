import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Button, Text, FAB, Searchbar, Chip, Menu, IconButton } from 'react-native-paper';
import { recordsService } from '../../services/recordsService';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../../services/authService';
import { colors, getDocumentTypeColor } from '../../constants/theme';

const RecordsListScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  const documentTypes = ['ALL', 'PRESCRIPTION', 'LAB_REPORT', 'SCAN', 'OTHER'];

  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, [filterType, showArchived])
  );

  const loadRecords = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterType !== 'ALL') {
        filters.document_type = filterType;
      }
      if (showArchived) {
        filters.is_archived = true;
      }
      const data = await recordsService.getRecords(filters);
      setRecords(data.results || data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load records. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const handleDelete = (recordId) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recordsService.deleteRecord(recordId);
              loadRecords();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery || 
      record.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.source_doctor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Separate component for record item to properly use hooks
  const RecordItem = ({ item, onDelete, navigation }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    
    return (
      <Card 
        style={styles.card}
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.fileName}>
              {item.file_name}
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('RecordDetail', { recordId: item.id });
                }}
                title="View Details"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(item.id);
                }}
                title="Delete"
              />
            </Menu>
          </View>
          <Chip 
            style={[styles.chip, { 
              borderColor: getDocumentTypeColor(item.document_type),
            }]} 
            mode="outlined"
            selected={false}
          >
            {item.document_type}
          </Chip>
          <Text variant="bodyMedium" style={styles.doctor}>
            Dr. {item.source_doctor}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {new Date(item.date_of_record).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderRecord = ({ item }) => (
    <RecordItem item={item} onDelete={handleDelete} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search records..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
          inputStyle={{ color: colors.textPrimary }}
        />
        <View style={styles.filters}>
          <FlatList
            horizontal
            data={documentTypes}
            renderItem={({ item }) => (
              <Chip
                selected={filterType === item}
                onPress={() => setFilterType(item)}
                style={[
                  styles.filterChip,
                  filterType === item && styles.filterChipSelected
                ]}
                selectedColor={colors.textOnPrimary}
                textStyle={filterType === item ? styles.filterChipTextSelected : styles.filterChipText}
              >
                {item}
              </Chip>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No records found
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('UploadRecord', { 
                preselectedType: filterType !== 'ALL' ? filterType : null 
              })}
              style={styles.emptyButton}
            >
              Upload Your First Record
            </Button>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to UploadRecord in the same stack with preselected type
          navigation.navigate('UploadRecord', { 
            preselectedType: filterType !== 'ALL' ? filterType : null 
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 12,
    elevation: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchbar: {
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  filters: {
    marginTop: 5,
  },
  filterChip: {
    marginRight: 5,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textPrimary,
  },
  filterChipTextSelected: {
    color: colors.textOnPrimary,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontWeight: 'bold',
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  doctor: {
    marginTop: 5,
    color: colors.textSecondary,
  },
  date: {
    marginTop: 5,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginBottom: 20,
    color: colors.textSecondary,
  },
  emptyButton: {
    marginTop: 10,
  },
});

export default RecordsListScreen;

