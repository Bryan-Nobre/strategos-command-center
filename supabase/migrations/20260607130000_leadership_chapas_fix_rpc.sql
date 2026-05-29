-- Remove assinatura antiga do RPC de landing antes da versão com chapas
DROP FUNCTION IF EXISTS public.register_supporter_from_landing(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
