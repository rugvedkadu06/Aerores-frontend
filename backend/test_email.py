import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys

def test_email():
    sender_email = "demorgvd2@gmail.com" 
    sender_password = "viop xdcq nazc hsjv" 
    receiver_email = "kadurugved0@gmail.com"
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = "AeroResilience Test Email"
    
    body = "This is a test email from the debugging script."
    msg.attach(MIMEText(body, 'plain'))
    
    print(f"Attempting to connect to smtp.gmail.com:465 (SSL) with user {sender_email}...")
    
    try:
        # Matches the fix in main.py
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        print("Connected. Logging in...")
        server.login(sender_email, sender_password)
        print("Logged in. Sending mail...")
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        print("SUCCESS: Email sent successfully.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"ERROR: Authentication failed. Code: {e.smtp_code}, Error: {e.smtp_error}")
        return False
    except Exception as e:
        print(f"ERROR: An exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_email()
