import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip, IconButton, Menu } from 'react-native-paper';
import { sharingService } from '../../services/sharingService';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/theme';

const ShareHistoryScreen = ({ navigation }) => {
  const [shareTokens, setShareTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadShareTokens();
    }, [])
  );

  const loadShareTokens = async () => {
    try {
      setLoading(true);
      const data = await sharingService.getShareTokens();
      setShareTokens(data.results || data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load share history.');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShareTokens();
  };

  const handleRevoke = async (tokenId) => {
    Alert.alert(
      'Revoke Share',
      'Are you sure you want to revoke this share?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingService.revokeShareToken(tokenId);
              loadShareTokens();
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke share.');
            }
          },
        },
      ]
    );
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  // Separate component for share token item to properly use hooks
  const ShareTokenItem = ({ item, onRevoke, navigation }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const expired = isExpired(item.expires_at);
    const revoked = item.is_revoked;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Chip
                style={styles.methodChip}
                mode="outlined"
                icon={item.share_method === 'QR_CODE' ? 'qrcode' : 'link'}
              >
                {item.share_method}
              </Chip>
              {revoked && (
                <Chip style={[styles.statusChip, styles.revokedChip]}>Revoked</Chip>
              )}
              {expired && !revoked && (
                <Chip style={[styles.statusChip, styles.expiredChip]}>Expired</Chip>
              )}
              {!expired && !revoked && (
                <Chip style={[styles.statusChip, styles.activeChip]}>Active</Chip>
              )}
            </View>
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
              {!revoked && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    // Navigate to Home tab first, then to ShareRecords
                    navigation.navigate('Home', {
                      screen: 'ShareRecords',
                      params: { 
                        recordIds: item.records?.map(r => r.id) || [],
                        existingToken: item 
                      }
                    });
                  }}
                  title="View Details"
                />
              )}
              {!revoked && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onRevoke(item.id);
                  }}
                  title="Revoke"
                />
              )}
            </Menu>
          </View>

          <Text variant="bodyMedium" style={styles.recordCount}>
            {item.records_info?.length || 0} record(s) shared
          </Text>

          <Text variant="bodySmall" style={styles.date}>
            Created: {new Date(item.created_at).toLocaleString()}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            Expires: {new Date(item.expires_at).toLocaleString()}
          </Text>
          {item.max_access_count && (
            <Text variant="bodySmall" style={styles.date}>
              Access: {item.current_access_count} / {item.max_access_count}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderShareToken = ({ item }) => (
    <ShareTokenItem item={item} onRevoke={handleRevoke} navigation={navigation} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={shareTokens}
        renderItem={renderShareToken}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No share history found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Share records to see them here
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodChip: {
    marginRight: 5,
  },
  statusChip: {
    marginLeft: 5,
  },
  activeChip: {
    backgroundColor: colors.success,
  },
  expiredChip: {
    backgroundColor: colors.warning,
  },
  revokedChip: {
    backgroundColor: colors.error,
  },
  recordCount: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  date: {
    marginTop: 5,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginBottom: 10,
    color: colors.textSecondary,
  },
  emptySubtext: {
    color: colors.textDisabled,
  },
});

export default ShareHistoryScreen;

