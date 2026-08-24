/**
 * src/i18n/locales/tr.ts
 *
 * Turkish (Türkçe) translations.
 */

import type { TranslationMap } from '../../types/i18n.types';

const tr: TranslationMap = {
  // ── Validation ─────────────────────────────────────────────────────────────
  'validation.failed': 'Doğrulama başarısız',
  'validation.email.invalid': 'Geçersiz e-posta adresi',
  'validation.password.required': 'Şifre zorunludur',
  'validation.password.tooShort': 'Şifre en az 8 karakter olmalıdır',
  'validation.password.tooLong': 'Şifre 72 karakteri geçemez',
  'validation.password.needsUppercase': 'Şifre en az bir büyük harf içermelidir',
  'validation.password.needsLowercase': 'Şifre en az bir küçük harf içermelidir',
  'validation.password.needsNumber': 'Şifre en az bir rakam içermelidir',
  'validation.password.needsSpecial': 'Şifre en az bir özel karakter içermelidir',
  'validation.name.tooShort': 'İsim en az 2 karakter olmalıdır',
  'validation.name.tooLong': 'İsim 100 karakteri geçemez',
  'validation.refreshToken.required': 'Yenileme token\'ı zorunludur',

  // ── Auth Success ───────────────────────────────────────────────────────────
  'auth.register.success': 'Hesap başarıyla oluşturuldu',
  'auth.login.success': 'Başarıyla giriş yapıldı',
  'auth.logout.success': 'Başarıyla çıkış yapıldı',
  'auth.me.success': 'Kullanıcı profili getirildi',
  'auth.refresh.success': 'Token başarıyla yenilendi',

  // ── Auth Errors ────────────────────────────────────────────────────────────
  'auth.emailInUse': 'Bu e-posta adresiyle zaten bir hesap mevcut',
  'auth.signupFailed': 'Kayıt işlemi başarısız oldu',
  'auth.loginFailed': 'Giriş işlemi beklenmedik bir hatayla başarısız oldu',
  'auth.invalidCredentials': 'E-posta veya şifre hatalı',
  'auth.emailConfirmationRequired':
    'Kayıt için e-posta onayı gereklidir. Lütfen gelen kutunuzu kontrol edin.',
  'auth.invalidToken': 'Geçersiz veya süresi dolmuş erişim token\'ı',
  'auth.missingToken': 'Erişim token\'ı zorunludur',
  'auth.profileNotFound': 'Kullanıcı profili bulunamadı',
  'auth.invalidRefreshToken': 'Geçersiz veya süresi dolmuş yenileme token\'ı',
  'auth.refreshFailed': 'Oturum yenilenemedi',
  'auth.unauthenticated': 'Bu işlem için giriş yapmanız gerekiyor',

  // ── System Errors ──────────────────────────────────────────────────────────
  'error.internalError': 'Sunucu hatası oluştu',
  'error.notFound': 'Kaynak bulunamadı',
  'error.forbidden': 'Erişim reddedildi',
  'error.insufficientRole': 'Bu işlemi gerçekleştirme yetkiniz yok',
  'error.routeNotFound': 'İstenen endpoint mevcut değil',
  'error.rateLimitExceeded': 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  'error.badRequest': 'Geçersiz istek',

  // ── Profile Success ────────────────────────────────────────────────────────
  'profile.getSuccess': 'Profil getirildi',
  'profile.updateSuccess': 'Profil başarıyla güncellendi',
  'profile.deleteSuccess': 'Hesap başarıyla silindi',

  // ── Profile Errors ────────────────────────────────────────────────────────
  'profile.notFound': 'Profil bulunamadı',
  'profile.usernameInUse': 'Bu kullanıcı adı zaten alınmış',
  'profile.unauthorized': 'Bu profili düzenleme yetkiniz yok',
  'profile.isPrivate': 'Bu profil gizlidir',
};

export default tr;
