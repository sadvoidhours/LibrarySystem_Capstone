import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { getThemePalette, radii, shadows, spacing } from '../theme/colors';

export default function ResponsiveSidebarShell({ title, subtitle, initialRouteName, items }) {
  const themeMode = useSelector((state) => state.auth.user?.themePreference || 'light');
  const palette = getThemePalette(themeMode);
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const [activeRoute, setActiveRoute] = useState(initialRouteName);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isWide) {
      setSidebarOpen(false);
    }
  }, [isWide]);

  useEffect(() => {
    setActiveRoute(initialRouteName);
  }, [initialRouteName]);

  const activeItem = useMemo(
    () => items.find((item) => item.name === activeRoute) || items[0],
    [activeRoute, items]
  );

  const navigate = useCallback(
    (routeName) => {
      const nextItem = items.find((item) => item.name === routeName);
      if (!nextItem) {
        return;
      }

      setActiveRoute(nextItem.name);
      if (!isWide) {
        setSidebarOpen(false);
      }
    },
    [isWide, items]
  );

  const navigation = useMemo(
    () => ({
      navigate,
      push: navigate,
      replace: navigate,
      goBack: () => null,
      canGoBack: () => false,
      setParams: () => null,
    }),
    [navigate]
  );

  const ActiveScreen = activeItem?.component;
  const currentLabel = activeItem?.label || activeItem?.name || title;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <View style={[styles.shell, isWide && styles.shellWide]}>
        {isWide ? (
          <Sidebar
            title={title}
            subtitle={subtitle}
            items={items}
            activeRoute={activeItem?.name}
            palette={palette}
            onNavigate={navigate}
            onClose={() => null}
            compact={false}
          />
        ) : (
          <View style={[styles.mobileTopBar, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
            <Pressable onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
              <Ionicons name="menu-outline" size={22} color={palette.gray800} />
            </Pressable>
            <View style={styles.mobileTitleWrap}>
              <Text style={[styles.mobileTitle, { color: palette.gray800 }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Pressable onPress={() => setSidebarOpen(true)} style={[styles.currentRouteChip, { backgroundColor: palette.greenLight }]}>
              {activeItem?.icon ? <Ionicons name={activeItem.icon} size={14} color={palette.chestnut} /> : null}
              <Text style={[styles.currentRouteText, { color: palette.chestnut }]} numberOfLines={1}>
                {currentLabel}
              </Text>
              <Ionicons name="chevron-down-outline" size={14} color={palette.chestnut} />
            </Pressable>
          </View>
        )}

        <View style={[styles.content, isWide && styles.contentWide]}>
          {ActiveScreen ? <ActiveScreen navigation={navigation} route={{ name: activeItem?.name }} /> : null}
        </View>
      </View>

      {!isWide ? (
        <Modal transparent visible={sidebarOpen} animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.backdropPressable} onPress={() => setSidebarOpen(false)} />
            <View style={[styles.mobileDrawer, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
              <Sidebar
                title={title}
                subtitle={subtitle}
                items={items}
                activeRoute={activeItem?.name}
                palette={palette}
                onNavigate={navigate}
                onClose={() => setSidebarOpen(false)}
                compact
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

function Sidebar({ title, subtitle, items, activeRoute, palette, onNavigate, onClose, compact }) {
  const sections = items.reduce((accumulator, item) => {
    const sectionName = item.section || 'Menu';
    if (!accumulator[sectionName]) {
      accumulator[sectionName] = [];
    }
    accumulator[sectionName].push(item);
    return accumulator;
  }, {});

  return (
    <View style={[styles.sidebar, compact && styles.sidebarCompact, { backgroundColor: palette.surface, borderColor: palette.gray100 }]}>
      <View style={styles.sidebarHeader}>
        <View style={[styles.brandMark, { backgroundColor: palette.chestnut }]}>
          <Ionicons name="library-outline" size={20} color={palette.white} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={[styles.sidebarTitle, { color: palette.gray800 }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.sidebarSubtitle, { color: palette.gray500 }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {!compact ? null : (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-outline" size={20} color={palette.gray600} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarListWrap}>
        <View style={styles.sidebarList}>
          {Object.entries(sections).map(([sectionName, sectionItems]) => (
            <View key={sectionName} style={styles.sectionGroup}>
              <Text style={[styles.sectionLabel, { color: palette.gray500 }]}>{sectionName.toUpperCase()}</Text>
              <View style={styles.sectionItems}>
                {sectionItems.map((item) => {
                  const active = item.name === activeRoute;
                  return (
                    <Pressable
                      key={item.name}
                      onPress={() => onNavigate(item.name)}
                      style={[
                        styles.sidebarItem,
                        compact && styles.sidebarItemCompact,
                        {
                          backgroundColor: active ? palette.greenLight : 'transparent',
                          borderColor: active ? palette.chestnut : palette.gray100,
                        },
                      ]}
                    >
                      <View style={[styles.sidebarIconWrap, { backgroundColor: active ? palette.chestnut : palette.surfaceAlt }]}>
                        <Ionicons name={item.icon} size={18} color={active ? palette.white : palette.gray600} />
                      </View>
                      <View style={styles.sidebarItemTextWrap}>
                        <View style={styles.sidebarItemHeaderRow}>
                          <Text style={[styles.sidebarItemLabel, { color: active ? palette.gray800 : palette.gray600 }]}>
                            {item.label}
                          </Text>
                          {active ? <Ionicons name="radio-button-on-outline" size={14} color={palette.chestnut} /> : null}
                        </View>
                        {!compact && item.description ? (
                          <Text style={[styles.sidebarItemDescription, { color: palette.gray500 }]} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {compact ? (
        <View style={[styles.sidebarFooter, { borderTopColor: palette.gray100 }]}>
          <Text style={[styles.sidebarFooterText, { color: palette.gray500 }]}>Tap a section to switch screens</Text>
          <Pressable onPress={onClose} style={[styles.closeDrawerButton, { backgroundColor: palette.chestnut }]}>
            <Ionicons name="close-outline" size={16} color={palette.white} />
            <Text style={[styles.closeDrawerText, { color: palette.white }]}>Close</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  shellWide: {
    flexDirection: 'row',
  },
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileTitleWrap: {
    flex: 1,
    gap: 2,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mobileSubtitle: {
    fontSize: 12,
  },
  currentRouteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  currentRouteText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentWide: {
    minWidth: 0,
  },
  sidebar: {
    width: 300,
    borderRightWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  sidebarCompact: {
    width: 300,
    height: '100%',
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderRadius: 0,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: {
    flex: 1,
    gap: 2,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sidebarSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarListWrap: {
    paddingBottom: spacing.md,
  },
  sidebarList: {
    gap: spacing.md,
  },
  sectionGroup: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  sectionItems: {
    gap: spacing.sm,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 72,
  },
  sidebarItemCompact: {
    minHeight: 52,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sidebarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  sidebarItemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sidebarItemLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sidebarFooterText: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeDrawerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
  },
  closeDrawerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropPressable: {
    flex: 1,
  },
  mobileDrawer: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    borderRightWidth: 1,
    paddingBottom: spacing.lg,
  },
});