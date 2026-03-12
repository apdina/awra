# Chat Guidelines Updated

## Changes Made

Updated all chat guidelines across all language files to reflect:
1. **Character limit changed from 500 to 140 characters**
2. **Guideline 5 updated to remove reporting reference** and instead mention moderator deletion

## Files Updated

### Translation Files

1. **messages/en/common.json** (English)
   - `guideline_3`: "Messages are limited to 140 characters"
   - `guideline_5`: "Moderators can delete inappropriate messages to keep the community safe"

2. **messages/es/common.json** (Spanish)
   - `guideline_3`: "Los mensajes están limitados a 140 caracteres"
   - `guideline_5`: "Los moderadores pueden eliminar mensajes inapropiados para mantener la comunidad segura"

3. **messages/it/common.json** (Italian)
   - `guideline_3`: "I messaggi sono limitati a 140 caratteri"
   - `guideline_5`: "I moderatori possono eliminare i messaggi inappropriati per mantenere la comunità sicura"

4. **messages/nl-NL/common.json** (Dutch)
   - `guideline_3`: "Berichten zijn beperkt tot 140 tekens"
   - `guideline_5`: "Moderators kunnen ongepaste berichten verwijderen om de gemeenschap veilig te houden"

5. **messages/ar-MA/common.json** (Arabic)
   - `guideline_3`: "الرسائل محدودة بـ 140 حرف"
   - `guideline_5`: "المشرفون يمكنهم حذف الرسائل غير اللائقة للحفاظ على سلامة المجتمع"

## Updated Guidelines Display

The chat guidelines now display as:

### English
- Be respectful and kind to all users
- No spam, harassment, or inappropriate content
- **Messages are limited to 140 characters** ✓ (Updated)
- You can edit messages within 5 minutes of sending
- **Moderators can delete inappropriate messages to keep the community safe** ✓ (Updated)

### Spanish
- Sé respetuoso y amable con todos los usuarios
- No spam, acoso o contenido inapropiado
- **Los mensajes están limitados a 140 caracteres** ✓ (Updated)
- Puedes editar mensajes dentro de 5 minutos después de enviar
- **Los moderadores pueden eliminar mensajes inapropiados para mantener la comunidad segura** ✓ (Updated)

## Display Location

The guidelines are displayed on the chat page at:
- **URL**: `/{locale}/chat`
- **Component**: `app/[locale]/chat/ChatPageContent.tsx`
- **Section**: "Chat Rules" / "Normas del Chat" / etc.

## Related Code

The character limit is enforced in:
- `convex/chat.ts` - `validateChatMessage()` function (140 character limit)
- `components/chat/chat-container.tsx` - Message input validation
- `components/chat/chat-container-simple.tsx` - Message input validation

## Verification

All translation files have been updated and are consistent across all supported languages:
- ✅ English
- ✅ Spanish
- ✅ Italian
- ✅ Dutch
- ✅ Arabic

The guidelines now accurately reflect the current system functionality where:
- Messages are limited to 140 characters
- Moderators handle message deletion (no user reporting)
