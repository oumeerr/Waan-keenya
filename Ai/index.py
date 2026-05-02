@app.route('/api/withdraw', methods=['POST'])
def process_withdrawal():
    data = request.json
    user_id = data.get('user_id')
    amount = float(data.get('amount'))

    # 1. Fetch user data from Supabase
    user_data = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    
    if not user_data.data:
        return {"status": "error", "message": "User not found"}, 404

    current_balance = user_data.data['wallet_balance']
    verified_phone = user_data.data.get('phone')

    # 2. Security Checks
    if not verified_phone:
        return {"status": "error", "message": "Please verify your phone in the bot first!"}, 400
    
    if current_balance < amount or amount < 100:
        return {"status": "error", "message": "Insufficient funds or below minimum."}, 400

    # 3. Deduct Balance & Log Request
    new_balance = current_balance - amount
    supabase.table("profiles").update({"wallet_balance": new_balance}).eq("id", user_id).execute()
    
    # 4. Notify Admin (You) about the withdrawal
    bot.send_message(ADMIN_ID, f"🔔 NEW WITHDRAWAL REQUEST!\nUser: {user_id}\nPhone: {verified_phone}\nAmount: {amount} ETB")

    return {"status": "success", "message": f"Withdrawal of {amount} ETB submitted!"}
