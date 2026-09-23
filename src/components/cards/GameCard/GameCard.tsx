import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GameModule } from '../../../types/gameModule';
import { GameAssetState } from '../../../types/gameModule';

const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - 40 - 14) / 2;

// ─── Legacy meta type (backward compat for GameHubScreen GAME_CARDS) ──────────
export interface GameCardMeta {
  id: string;
  name: string;
  glyph: string;
  tag: string;
  onlineCount: string;
  gradient: string[];
  route: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GameCardProps {
  /** Full module (preferred — from registry) */
  module?: GameModule;
  /** Legacy flat card meta (fallback) */
  card?: GameCardMeta;
  assetState?: GameAssetState;
  downloadProgress?: number;
  onPress: (card: GameCardMeta) => void;
  onDownloadPress?: (gameId: string) => void;
}

// ─── Asset State Badge ────────────────────────────────────────────────────────

function assetBadgeLabel(state: GameAssetState): string {
  switch (state) {
    case GameAssetState.READY:            return '▶ PLAY';
    case GameAssetState.NOT_INSTALLED:    return '⬇ DOWNLOAD';
    case GameAssetState.UPDATE_AVAILABLE: return '↑ UPDATE';
    case GameAssetState.DOWNLOADING:      return 'DOWNLOADING…';
    case GameAssetState.INSTALLING:       return 'INSTALLING…';
    case GameAssetState.ERROR:            return '⟳ RETRY';
    default:                              return '▶ PLAY';
  }
}

function assetBadgeColor(state: GameAssetState): string {
  switch (state) {
    case GameAssetState.READY:            return '#4BD07A';
    case GameAssetState.NOT_INSTALLED:    return '#F0C64A';
    case GameAssetState.UPDATE_AVAILABLE: return '#5AADFF';
    case GameAssetState.DOWNLOADING:
    case GameAssetState.INSTALLING:       return '#A0ADB8';
    case GameAssetState.ERROR:            return '#E6483A';
    default:                              return '#4BD07A';
  }
}

/**
 * GameCard — Memoized game tile for the 2-column game grid.
 * Accepts either a full GameModule (from registry) or legacy GameCardMeta.
 * Shows asset state badge (PLAY / DOWNLOAD / UPDATE / DOWNLOADING…).
 */
const GameCard: React.FC<GameCardProps> = React.memo(({
  module,
  card,
  assetState = GameAssetState.READY,
  downloadProgress = 0,
  onPress,
  onDownloadPress,
}) => {
  // Normalise module → card meta shape
  const meta: GameCardMeta = card ?? {
    id: module!.gameId,
    name: module!.gameName,
    glyph: module!.icon,
    tag: module!.playerTag,
    onlineCount: module!.onlineCountLabel,
    gradient: [module!.cardGradient[0], module!.cardGradient[1]],
    route: '',
  };

  const isDownloading =
    assetState === GameAssetState.DOWNLOADING ||
    assetState === GameAssetState.INSTALLING;

  const isPlayable = assetState === GameAssetState.READY;

  const handlePress = useCallback(() => {
    if (isPlayable) {
      onPress(meta);
    } else if (onDownloadPress) {
      onDownloadPress(meta.id);
    } else {
      onPress(meta);
    }
  }, [isPlayable, meta, onPress, onDownloadPress]);

  const badgeLabel = assetBadgeLabel(assetState);
  const badgeColor = assetBadgeColor(assetState);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.tileWrapper}
      accessibilityLabel={`${meta.name} — ${badgeLabel}`}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={meta.gradient as [string, string]}
        style={styles.tile}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top Row: online count badge */}
        <View style={styles.topRow}>
          <View style={styles.tileLiveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.tileLiveText}>{meta.onlineCount}</Text>
          </View>
        </View>

        {/* Big Watermarked Glyph */}
        <Text style={styles.tileGlyph}>{meta.glyph}</Text>

        {/* Bottom: title, tag, asset state button */}
        <View style={styles.tileBottom}>
          <Text style={styles.tileTitle}>{meta.name}</Text>
          <Text style={styles.tileTag}>{meta.tag}</Text>

          {/* Asset State Button */}
          <View style={[styles.assetBadge, { backgroundColor: `${badgeColor}22`, borderColor: `${badgeColor}55` }]}>
            <Text style={[styles.assetBadgeText, { color: badgeColor }]}>
              {badgeLabel}
            </Text>
          </View>

          {/* Download Progress Bar */}
          {isDownloading && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress}%` as any }]} />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

GameCard.displayName = 'GameCard';

export default GameCard;

const styles = StyleSheet.create({
  tileWrapper: {
    width: TILE_WIDTH,
    minHeight: 168,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tileLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 8,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5CF27A',
  },
  tileLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tileGlyph: {
    position: 'absolute',
    right: 4,
    bottom: 0,
    fontSize: 72,
    opacity: 0.18,
    transform: [{ rotate: '-8deg' }],
  },
  tileBottom: {
    zIndex: 2,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tileTag: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
    marginBottom: 6,
  },
  assetBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 2,
  },
  assetBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#F0C64A',
    borderRadius: 2,
  },
});
