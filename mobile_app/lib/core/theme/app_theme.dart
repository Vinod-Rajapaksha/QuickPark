import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'color_palette.dart';

class AppTheme {
  static const Color primaryColor = ColorPalette.primary;
  static const Color accentColor = ColorPalette.secondary;
  static const Color backgroundColor = ColorPalette.backgroundLight;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: ColorPalette.primary,
      scaffoldBackgroundColor: ColorPalette.backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: ColorPalette.primary,
        secondary: ColorPalette.secondary,
        surface: ColorPalette.surfaceLight,
        error: ColorPalette.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: ColorPalette.textPrimaryLight,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).apply(
        bodyColor: ColorPalette.textPrimaryLight,
        displayColor: ColorPalette.textPrimaryLight,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: ColorPalette.textPrimaryLight,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: ColorPalette.textPrimaryLight),
        titleTextStyle: GoogleFonts.outfit(
          color: ColorPalette.textPrimaryLight,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ColorPalette.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          elevation: 4,
          shadowColor: ColorPalette.primary.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ColorPalette.primary,
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
        hintStyle: GoogleFonts.outfit(color: ColorPalette.textSecondaryLight),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: ColorPalette.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: ColorPalette.error),
        ),
      ),
      cardTheme: CardThemeData(
        color: ColorPalette.surfaceLight,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.05),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: EdgeInsets.zero,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: ColorPalette.surfaceLight,
        selectedItemColor: ColorPalette.primary,
        unselectedItemColor: ColorPalette.textSecondaryLight,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
    );
  }
}
