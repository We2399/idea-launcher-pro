-- Clean up orphaned document_storage records for Mari Sol (files don't exist in storage)
DELETE FROM document_storage 
WHERE user_id = 'cfa176c6-abda-43c5-a41b-77cb00620886' 
AND id IN ('d9b38197-f529-4172-899d-620f46a41eed', '4c00a186-2036-4601-819f-3dc6ad9919e6');