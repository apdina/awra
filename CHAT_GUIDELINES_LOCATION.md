# Chat Guidelines Message Location

## Where to Find It

The chat guidelines message "Normas del Chat" is located in two places:

### 1. **Translation Files** (Content)
**File**: `messages/es/common.json` (Spanish version)

**Keys**:
```json
{
  "chat": {
    "guidelines_title": "Normas del Chat",
    "guideline_1": "Sé respetuoso y amable con todos los usuarios",
    "guideline_2": "No spam, acoso o contenido inapropiado",
    "guideline_3": "Los mensajes están limitados a 500 caracteres",
    "guideline_4": "Puedes editar mensajes dentro de 5 minutos después de enviar",
    "guideline_5": "Reporta mensajes inapropiados para ayudar a mantener la comunidad segura"
  }
}
```

**Other Language Files**:
- `messages/en/common.json` - English
- `messages/it/common.json` - Italian
- `messages/nl-NL/common.json` - Dutch
- `messages/ar-MA/common.json` - Arabic

### 2. **UI Component** (Display)
**File**: `app/[locale]/chat/ChatPageContent.tsx`

**Location**: Lines 165-200 (Chat Rules section)

**Component Structure**:
```tsx
{/* Chat Rules */}
<div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
    <MessageCircle className="w-5 h-5 text-blue-400" />
    {t('chat.guidelines_title')}
  </h3>
  <ul className="space-y-2 text-sm text-slate-300">
    <li className="flex items-start gap-2">
      <span className="text-blue-400 mt-0.5">•</span>
      <span>{t('chat.guideline_1')}</span>
    </li>
    {/* ... more guidelines ... */}
  </ul>
</div>
```

## How to Edit

### To Change the Text:
1. Open `messages/es/common.json` (or the language file you want to edit)
2. Find the `"chat"` section
3. Edit the `guideline_1` through `guideline_5` values
4. Save the file

### To Change the Display:
1. Open `app/[locale]/chat/ChatPageContent.tsx`
2. Modify the styling in the Chat Rules section (lines 165-200)
3. The component uses Tailwind CSS classes for styling

### To Add/Remove Guidelines:
1. Add/remove keys in the translation files (e.g., `guideline_6`)
2. Add/remove corresponding `<li>` elements in `ChatPageContent.tsx`
3. Update the `t()` function call to reference the new key

## Current Guidelines

The system currently displays 5 guidelines:

1. **Respect**: Be respectful and kind to all users
2. **No Harassment**: No spam, harassment, or inappropriate content
3. **Character Limit**: Messages are limited to 500 characters
4. **Edit Window**: You can edit messages within 5 minutes of sending
5. **Reporting**: Report inappropriate messages to help keep the community safe

## Note About Guideline 5

⚠️ **Important**: Guideline 5 mentions "Reporta mensajes inapropiados" (Report inappropriate messages), but the reporting system has been removed from the application. You may want to update this guideline to reflect the current functionality where moderators handle message deletion directly.

**Suggested Update**:
```json
"guideline_5": "Los moderadores pueden eliminar mensajes inapropiados para mantener la comunidad segura"
```

(Translation: "Moderators can delete inappropriate messages to keep the community safe")

## Display Location in App

The guidelines appear on the chat page at:
- **URL**: `/{locale}/chat`
- **Position**: Below the chat interface
- **Styling**: White text on a semi-transparent dark background with a blue border
- **Icon**: Message circle icon in blue

## Internationalization

The guidelines are fully internationalized using the `useTranslation()` hook from `next-i18next`. The language is automatically selected based on the user's locale from the URL.
