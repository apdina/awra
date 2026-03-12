# Guideline 4 Removed - Edit Message Feature

## Changes Made

Removed guideline 4 (about editing messages within 5 minutes) from all chat guidelines across all language files and the UI component.

## Files Updated

### Translation Files

1. **messages/en/common.json** (English)
   - Removed: `"guideline_4": "You can edit messages within 5 minutes of sending"`
   - Renumbered: Old `guideline_5` is now `guideline_4`

2. **messages/es/common.json** (Spanish)
   - Removed: `"guideline_4": "Puedes editar mensajes dentro de 5 minutos después de enviar"`
   - Renumbered: Old `guideline_5` is now `guideline_4`

3. **messages/it/common.json** (Italian)
   - Removed: `"guideline_4": "Puoi modificare i messaggi entro 5 minuti dall'invio"`
   - Renumbered: Old `guideline_5` is now `guideline_4`

4. **messages/nl-NL/common.json** (Dutch)
   - Removed: `"guideline_4": "Je kunt berichten binnen 5 minuten na verzending bewerken"`
   - Renumbered: Old `guideline_5` is now `guideline_4`

5. **messages/ar-MA/common.json** (Arabic)
   - Removed: `"guideline_4": "تقدر تعدل الرسائل خلال 5 دقائق من الإرسال"`
   - Renumbered: Old `guideline_5` is now `guideline_4`

### UI Component

**File**: `app/[locale]/chat/ChatPageContent.tsx`
- Removed the 5th `<li>` element that displayed `guideline_5`
- Now displays only 4 guidelines instead of 5

## Updated Guidelines

The chat now displays only 4 guidelines:

### English
1. Be respectful and kind to all users
2. No spam, harassment, or inappropriate content
3. Messages are limited to 140 characters
4. Moderators can delete inappropriate messages to keep the community safe

### Spanish
1. Sé respetuoso y amable con todos los usuarios
2. No spam, acoso o contenido inapropiado
3. Los mensajes están limitados a 140 caracteres
4. Los moderadores pueden eliminar mensajes inapropiados para mantener la comunidad segura

### Italian
1. Sii rispettoso e gentile con tutti gli utenti
2. Niente spam, molestie o contenuti inappropriati
3. I messaggi sono limitati a 140 caratteri
4. I moderatori possono eliminare i messaggi inappropriati per mantenere la comunità sicura

### Dutch
1. Wees respectvol en vriendelijk naar alle gebruikers
2. Geen spam, intimidatie of ongepaste inhoud
3. Berichten zijn beperkt tot 140 tekens
4. Moderators kunnen ongepaste berichten verwijderen om de gemeenschap veilig te houden

### Arabic
1. كون محترم ولطيف مع جميع المستخدمين
2. ممنوع السبام أو المضايقة أو المحتوى غير اللائق
3. الرسائل محدودة بـ 140 حرف
4. المشرفون يمكنهم حذف الرسائل غير اللائقة للحفاظ على سلامة المجتمع

## Note

The edit message feature still exists in the application (users can edit their own messages within 5 minutes), but it's no longer mentioned in the chat guidelines. This is intentional - the guidelines now focus on the core rules and moderation approach rather than feature details.

## Display Location

The guidelines are displayed on the chat page at:
- **URL**: `/{locale}/chat`
- **Component**: `app/[locale]/chat/ChatPageContent.tsx`
- **Section**: "Chat Rules" / "Normas del Chat" / etc.
