UPDATE auth.users
SET encrypted_password = crypt('AliciA909', gen_salt('bf')),
    updated_at = now()
WHERE email = 'roxon1985@yahoo.com';