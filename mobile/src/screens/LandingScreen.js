import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { baseStyles, fonts, palette, radii, shadows, spacing } from '../theme/colors';
import StyledButton from '../components/StyledButton';
import Card from '../components/Card';

/* ── campus images ── */
const CAMPUS_IMAGES = [
  { id: '1', source: require('../../assets/img1.jpg'), caption: 'Students of Pateros Technological College' },
  { id: '2', source: require('../../assets/img2.jpg'), caption: 'PTC Main Building' },
  { id: '3', source: require('../../assets/img3.jpg'), caption: 'Campus Exterior View' },
];

/* ── features data ── */
const FEATURES = [
  {
    icon: 'book-outline',
    color: palette.blue,
    title: 'Digital Catalog',
    desc: 'Browse and search the full book collection by title, author, or category.',
  },
  {
    icon: 'scan-outline',
    color: palette.green,
    title: 'Barcode Scanning',
    desc: 'Fast borrow & return transactions via QR and barcode scanning.',
  },
  {
    icon: 'notifications-outline',
    color: palette.orange,
    title: 'Smart Notifications',
    desc: 'Automatic due-date reminders and overdue notices so you never miss a deadline.',
  },
  {
    icon: 'qr-code-outline',
    color: palette.chestnut,
    title: 'Digital ID',
    desc: 'Your personal QR barcode ID — no physical card needed.',
  },
  {
    icon: 'cash-outline',
    color: palette.olive,
    title: 'Penalty Tracking',
    desc: 'Transparent penalty computation in Philippine Peso (₱) with payment history.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: palette.red,
    title: 'Role-Based Access',
    desc: 'Separate portals for students, librarians, and system administrators.',
  },
];

const HERO_STATS = [
  { value: '24/7', label: 'Digital access', icon: 'time-outline' },
  { value: 'QR', label: 'Fast identification', icon: 'qr-code-outline' },
  { value: 'Auto', label: 'Due reminders', icon: 'notifications-outline' },
];

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Register your account',
    text: 'Use your PTC email and wait for verification from the library team.',
  },
  {
    step: '02',
    title: 'Browse and request',
    text: 'Search the catalog, review availability, and request a book in a few taps.',
  },
  {
    step: '03',
    title: 'Borrow, return, and settle',
    text: 'Track due dates, receive reminders, and settle penalties inside the app.',
  },
];

const AUDIENCE = [
  {
    title: 'Students',
    text: 'See your borrowings, QR ID, reminders, and payments in one dashboard.',
    icon: 'school-outline',
  },
  {
    title: 'Faculty',
    text: 'Manage library use efficiently while staying on top of return dates.',
    icon: 'people-outline',
  },
  {
    title: 'Library staff',
    text: 'Track circulation, announcements, payments, and account verification.',
    icon: 'briefcase-outline',
  },
];

const LANDING_HIGHLIGHTS = [
  'Modern mobile-first interface',
  'Fast barcode and QR workflows',
  'Penalty tracking and reminders',
  'Built for both web and mobile',
];

/* ── Google Maps embed (web only, fallback button for native) ── */
const MAP_EMBED_URI =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2723.0681743680248!2d121.06900020326326!3d14.552619866151995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8863fae6025%3A0xe4f1a76191156148!2sPateros%20Technological%20College!5e1!3m2!1sen!2sph!4v1774319850886!5m2!1sen!2sph';

const MAP_LINK = 'https://maps.google.com/?q=Pateros+Technological+College';

function MapSection() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapWrap}>
        <iframe
          src={MAP_EMBED_URI}
          width="100%"
          height="300"
          style={{ border: 0, borderRadius: 12 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Pateros Technological College"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.mapFallback}
      activeOpacity={0.8}
      onPress={() => Linking.openURL(MAP_LINK)}
    >
      <Ionicons name="map-outline" size={40} color={palette.chestnut} />
      <Text style={styles.mapFallbackText}>Open in Google Maps</Text>
    </TouchableOpacity>
  );
}

/* ── slideshow component ── */
function CampusSlideshow() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [current, setCurrent] = useState(0);
  const { width } = useWindowDimensions();
  const isCompact = width < 600;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setCurrent((prev) => (prev + 1) % CAMPUS_IMAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.slideshowWrap, isCompact && { height: 280 }]}>
      <Animated.Image
        source={CAMPUS_IMAGES[current].source}
        style={[styles.slideshowImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />
      {/* dots */}
      <View style={styles.slideshowDots}>
        {CAMPUS_IMAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              current === i && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/* ── main screen ── */
export default function LandingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompact = width < 600;
  const heroMinHeight = isCompact ? Math.min(900, Math.max(600, Math.round(width * 1.2))) : 560;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground
        source={require('../../assets/img2.jpg')}
        style={[styles.heroBg, isCompact && styles.heroBgCompact, { minHeight: heroMinHeight }]}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <View style={[styles.heroContent, baseStyles.webCenter, isCompact && styles.heroContentCompact]}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="library-outline" size={14} color={palette.white} />
              <Text style={styles.heroBadgeText}>Pateros Technological College</Text>
            </View>
            <View style={[styles.heroBadge, styles.heroBadgeSoft]}>
              <Ionicons name="phone-portrait-outline" size={14} color={palette.white} />
              <Text style={styles.heroBadgeText}>Web + mobile</Text>
            </View>
          </View>

          <View style={[styles.heroSplit, isWide && styles.heroSplitWide, isCompact && styles.heroSplitCompact]}>
            <View style={[styles.heroCopyBlock, isCompact && styles.heroCopyBlockCompact]}>
              <View style={[styles.logoWrap, isCompact && styles.logoWrapCompact]}>
                <Image source={require('../../assets/logo.png')} style={[styles.logo, isCompact && styles.logoCompact]} />
              </View>
              <Text style={[styles.heroKicker, isCompact && styles.heroKickerCompact]}>Library Management System</Text>
              <Text style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>
                A clearer way to browse, borrow, and stay on schedule.
              </Text>
              <Text style={[styles.heroBody, isCompact && styles.heroBodyCompact]}>
                Everything students and faculty need is organized into a single, polished workspace:
                catalog browsing, QR identification, reminders, penalties, and account updates.
              </Text>

              <View style={[styles.heroCta, isCompact && styles.heroCtaCompact]}>
                <StyledButton
                  title="Sign In"
                  variant="success"
                  onPress={() => navigation.navigate('Login')}
                  style={isCompact && styles.heroButtonCompact}
                />
                <StyledButton
                  title="Create Account"
                  variant="outlineWhite"
                  onPress={() => navigation.navigate('Register')}
                  style={isCompact && styles.heroButtonCompact}
                />
              </View>
            </View>

            {isCompact ? (
              <View style={styles.heroCompactStack}>
                <View style={styles.heroCompactPanel}>
                  <Text style={styles.heroPanelTitle}>What you get</Text>
                  <View style={styles.heroCompactStats}>
                    {HERO_STATS.map((stat) => (
                      <View key={stat.label} style={styles.heroCompactStatCard}>
                        <Ionicons name={stat.icon} size={16} color={palette.green} />
                        <Text style={styles.heroCompactStatValue}>{stat.value}</Text>
                        <Text style={styles.heroCompactStatLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.highlightRow, styles.highlightRowCompact]}>
                  {LANDING_HIGHLIGHTS.map((item) => (
                    <View key={item} style={styles.highlightPill}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={palette.green} />
                      <Text style={styles.highlightText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.heroPanel}>
                <Text style={styles.heroPanelTitle}>What you get</Text>
                <View style={styles.heroStats}>
                  {HERO_STATS.map((stat) => (
                    <View key={stat.label} style={styles.heroStatCard}>
                      <View style={styles.heroStatIcon}>
                        <Ionicons name={stat.icon} size={18} color={palette.green} />
                      </View>
                      <Text style={styles.heroStatValue}>{stat.value}</Text>
                      <Text style={styles.heroStatLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.heroPreviewCard}>
                  <Text style={styles.heroPreviewLabel}>Trusted by the campus community</Text>
                  <Text style={styles.heroPreviewText}>
                    Built to make the library experience faster, easier, and more transparent for every
                    user role.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>

      <View style={[styles.section, baseStyles.webCenter]}>
        <Text style={styles.sectionTitle}>Who it is for</Text>
        <Text style={styles.sectionSubtitle}>A simple experience tailored to each library role</Text>
        <View style={styles.audienceGrid}>
          {AUDIENCE.map((item) => (
            <Card key={item.title} style={styles.audienceCard}>
              <View style={styles.audienceIcon}>
                <Ionicons name={item.icon} size={24} color={palette.green} />
              </View>
              <Text style={styles.audienceTitle}>{item.title}</Text>
              <Text style={styles.audienceText}>{item.text}</Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={[styles.section, baseStyles.webCenter]}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <Text style={styles.sectionSubtitle}>The workflow is short, clear, and easy to remember</Text>
        <View style={styles.processGrid}>
          {PROCESS_STEPS.map((step) => (
            <Card key={step.step} style={styles.processCard}>
              <Text style={styles.processStep}>{step.step}</Text>
              <Text style={styles.processTitle}>{step.title}</Text>
              <Text style={styles.processText}>{step.text}</Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={[styles.section, baseStyles.webCenter]}>
        <Text style={styles.sectionTitle}>Core features</Text>
        <Text style={styles.sectionSubtitle}>Everything you need in one app</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <Card key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={[styles.section, baseStyles.webCenter]}>
        <Text style={styles.sectionTitle}>Our campus</Text>
        <Text style={styles.sectionSubtitle}>Pateros Technological College in pictures</Text>
        <CampusSlideshow />
      </View>

      <View style={[styles.section, baseStyles.webCenter]}>
        <Text style={styles.sectionTitle}>Find us</Text>
        <Text style={styles.sectionSubtitle}>Pateros Technological College, Pateros, Metro Manila</Text>
        <MapSection />
      </View>

      <View style={[styles.footer, baseStyles.webCenter]}>
        <Text style={styles.footerText}>Ready to get started?</Text>
        <Text style={styles.footerBody}>
          Sign in to access your library dashboard, browse the catalog, and manage your borrowings.
        </Text>
        <View style={styles.footerCta}>
          <StyledButton title="Sign In Now" onPress={() => navigation.navigate('Login')} />
          <StyledButton title="Create Account" variant="outline" onPress={() => navigation.navigate('Register')} />
        </View>
      </View>

      {/* ─── Bottom ─── */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>
          © 2026 Pateros Technological College — Library Management System
        </Text>
      </View>
    </ScrollView>
  );
}

/* ── styles ── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  /* hero */
  heroBg: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 560,
    paddingVertical: spacing.lg,
    ...Platform.select({
      web: {
        minHeight: 620,
        height: 660,
      },
      default: {},
    }),
  },
  heroBgCompact: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 1.75,
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 32, 16, 0.62)',
  },
  heroContent: {
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    zIndex: 1,
    gap: spacing.lg,
  },
  heroContentCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 1.25,
    gap: spacing.xl,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroBadgeSoft: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroBadgeText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.white,
    letterSpacing: 0.4,
  },
  heroSplit: {
    gap: spacing.xl,
  },
  heroSplitCompact: {
    gap: spacing.xl,
  },
  heroSplitWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  heroCopyBlock: {
    flex: 1.2,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  heroCopyBlockCompact: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoWrap: {
    borderRadius: radii.full,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...shadows.lg,
    marginBottom: spacing.md,
  },
  logoWrapCompact: {
    padding: 8,
    marginBottom: spacing.md,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: radii.full,
  },
  logoCompact: {
    width: 60,
    height: 60,
  },
  heroKicker: {
    ...fonts.xs,
    ...fonts.bold,
    color: palette.greenMint,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroKickerCompact: {
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...fonts.xxl,
    ...fonts.bold,
    color: palette.white,
    textAlign: 'center',
    maxWidth: 720,
  },
  heroTitleCompact: {
    ...fonts.xl,
    lineHeight: 36,
    maxWidth: 380,
  },
  heroSubtitle: {
    ...fonts.base,
    color: 'rgba(255,255,255,0.90)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  heroBody: {
    ...fonts.base,
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
    maxWidth: 760,
  },
  heroBodyCompact: {
    ...fonts.sm,
    lineHeight: 21,
    maxWidth: 390,
  },
  heroCta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroCtaCompact: {
    marginTop: spacing.xl,
  },
  heroButtonCompact: {
    width: '100%',
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  highlightRowCompact: {
    marginTop: spacing.md,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  highlightText: {
    ...fonts.xs,
    ...fonts.semibold,
    color: palette.white,
  },
  heroPanel: {
    flex: 0.9,
    borderRadius: radii.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: spacing.md,
    ...Platform.select({
      web: {
        minWidth: 280,
        maxWidth: 420,
      },
      default: {},
    }),
  },
  heroPanelCompact: {
    width: '100%',
    maxWidth: '100%',
  },
  heroCompactPanel: {
    width: '100%',
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: spacing.md,
  },
  heroCompactStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  heroCompactStack: {
    width: '100%',
    gap: spacing.xl,
  },
  heroCompactStatCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 120,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    gap: 4,
  },
  heroCompactStatValue: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.white,
  },
  heroCompactStatLabel: {
    ...fonts.xs,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  heroPanelTitle: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.white,
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroStatCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    gap: 4,
  },
  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.white,
  },
  heroStatLabel: {
    ...fonts.xs,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  heroPreviewCard: {
    borderRadius: radii.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  heroPreviewLabel: {
    ...fonts.xs,
    ...fonts.bold,
    color: palette.greenMint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroPreviewText: {
    ...fonts.sm,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 20,
  },

  /* sections */
  section: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    ...Platform.select({
      web: {
        paddingVertical: spacing.xxl * 1.25,
      },
      default: {},
    }),
  },
  sectionTitle: {
    ...fonts.xl,
    ...fonts.bold,
    color: palette.gray800,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...fonts.base,
    color: palette.gray500,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },

  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  audienceCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 340,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  audienceIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: palette.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
    textAlign: 'center',
  },
  audienceText: {
    ...fonts.sm,
    color: palette.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },

  processGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  processCard: {
    flex: 1,
    minWidth: 220,
    maxWidth: 340,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  processStep: {
    ...fonts.xs,
    ...fonts.bold,
    color: palette.green,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  processTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
  },
  processText: {
    ...fonts.sm,
    color: palette.gray500,
    lineHeight: 20,
  },

  /* feature grid */
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  featureCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureTitle: {
    ...fonts.base,
    ...fonts.bold,
    color: palette.gray800,
    textAlign: 'center',
  },
  featureDesc: {
    ...fonts.sm,
    color: palette.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* slideshow */
  slideshowWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    height: 500,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: palette.gray200,
    backgroundColor: palette.gray100,
  },
  slideshowImage: {
    width: '100%',
    height: '100%',
  },
  slideshowDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: palette.white,
    width: 28,
  },

  /* map */
  mapWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  mapFallback: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.gray200,
    ...shadows.sm,
  },
  mapFallbackText: {
    ...fonts.base,
    ...fonts.semibold,
    color: palette.chestnut,
  },

  /* footer */
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.gray200,
  },
  footerText: {
    ...fonts.lg,
    ...fonts.bold,
    color: palette.gray800,
  },
  footerBody: {
    ...fonts.base,
    color: palette.gray500,
    textAlign: 'center',
    maxWidth: 660,
    lineHeight: 22,
  },
  footerCta: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  /* bottom */
  bottomBar: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  bottomText: {
    ...fonts.xs,
    color: palette.gray400,
    textAlign: 'center',
  },
});
