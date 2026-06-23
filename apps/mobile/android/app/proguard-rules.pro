# ProGuard / R8 rules cho PetOmi Owner Mobile (Flutter)
# Giu lai cac class can thiet de minify khong lam crash app.

# --- Flutter core ---
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# --- Giu annotation & generic signature (tranh loi reflection / JSON) ---
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# --- Cho phep R8 bo log ra khoi ban release (toi uu) ---
# (bo comment neu muon xoa Log.* trong release)
# -assumenosideeffects class android.util.Log {
#     public static *** d(...);
#     public static *** v(...);
#     public static *** i(...);
# }

# --- Neu sau nay them cac thu vien dung reflection (gson, retrofit...) thi bo sung rule o duoi ---
