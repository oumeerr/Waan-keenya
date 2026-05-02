# This must be in your api/index.py
@bot.message_handler(content_types=['contact'])
def handle_contact(message):
    user_id = message.from_user.id
    phone = message.contact.phone_number
    
    # Update Supabase
    try:
        supabase.table("profiles").update({"phone": phone}).eq("id", user_id).execute()
        bot.send_message(user_id, f"✅ Verified! Number {phone} is now linked to your wallet.")
    except Exception as e:
        bot.send_message(user_id, "❌ Error saving contact. Please try again.")
        print(f"Error: {e}")
