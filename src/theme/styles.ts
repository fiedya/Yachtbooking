// src/theme/colors.ts

import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radius, spacing, text } from './spacing';

export const styles = StyleSheet.create({
  /* ---------- Layout ---------- */
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenPadded: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
  },

  /* ---------- Headers & titles ---------- */
  title: {
    fontSize: text.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },

  subtitle: {
    fontSize: text.md,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: text.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },

  /* ---------- Text ---------- */
  textPrimary: {
    fontSize: text.base,
    color: colors.textPrimary,
  },

  textSecondary: {
    fontSize: text.md,
    color: colors.textSecondary,
  },

  textMuted: {
    fontSize: text.md,
    color: colors.textMuted,
  },

  link: {
    color: colors.primary,
    fontSize: text.sm,
    fontWeight: '500',
  },
  textOnPrimary: {
    color: '#ffffff',
    fontWeight: '500',
    },

  versionText: {
    fontSize: 11,
    color: '#999',
    margin: 0
    },

        heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    },

    bodyText: {
    fontSize: 16,
    lineHeight: 22,
    },

  /* ---------- Buttons ---------- */
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
     width: '100%',
     alignSelf: 'stretch',
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
  },

  buttonSecondary: {
    backgroundColor: colors.secondary,
  },

  buttonDisabled: {
    backgroundColor: '#a5b8ff',
  },

  buttonDanger: {
    backgroundColor: colors.secondary,
  },

  buttonText: {
    fontSize: text.base,
    fontWeight: '600',
    color: colors.white,
  },

  buttonDangerText: {
    color: colors.white,
  },

  /* ---------- Inputs ---------- */
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    fontSize: text.base,
    backgroundColor: '#fafafa',
  },

  label: {
    fontSize: text.md,
    marginBottom: spacing.xs,
  },

  /* ---------- Cards ---------- */
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },

    cardPadding: {
        padding: spacing.xs,
    },

    listPadding: {
    padding: 16,
    },

    cardImage: {
    width: '100%',
    height: 240,
    },

    cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
    },


  /* ---------- Avatar ---------- */
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 42,
    fontWeight: '600',
    color: colors.primary,
  },

  /* ---------- Modals ---------- */
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  /* ---------- Grid & table layouts ---------- */

gridRow: {
  flexDirection: 'row',
},

gridCellCenter: {
  justifyContent: 'center',
  alignItems: 'center',
},

gridCellTopCenter:{
  justifyContent: 'flex-start',
  alignItems: 'center',
},

gridBorderRight: {
  borderRightWidth: 1,
  borderColor: colors.border,
},

gridBorderBottom: {
  borderBottomWidth: 1,
  borderColor: colors.border,
},

/* ---------- Pills / toggles ---------- */

pill: {
  paddingHorizontal: spacing.sm,
  paddingVertical: 5,
  borderRadius: radius.round,
  marginVertical: 4,
  alignContent: 'center',
  alignSelf: 'center'
},

pillDefault:{

  backgroundColor: colors.border,
},

pillActive: {
  backgroundColor: colors.primary
},

pillInvisible:{
  backgroundColor: colors.transparent,
},

pillSecondary:{
  backgroundColor: colors.secondary,
},

/* ---------- Time / small text ---------- */

textXs: {
  fontSize: text.xs,
  color: colors.textSecondary,
},

/* ---------- Highlight states ---------- */

highlightBackground: {
  backgroundColor: '#eef6ff',
},

highlightText: {
  fontWeight: '600',
  color: colors.primary,
},

/* ---------- Absolute cards ---------- */

absoluteCard: {
  position: 'absolute',
  left: 2,
  right: 2,
  borderRadius: radius.sm,
  padding: 4,
  zIndex: 10,
  elevation: 4,
},

/*------------CALENDAR------------*/
iconButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.backgroundSoft,
},

iconText: {
  fontSize: 22,
  color: colors.primary,
},

listItem: {
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
},

listItemActive: {
  backgroundColor: colors.primary,
  borderRadius: 8,
},

});


