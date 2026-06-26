-- Add sample guides to demonstrate the app

-- Pizza Margherita guide
INSERT INTO guides (title, description, category_id, estimated_time, difficulty, is_active) VALUES
('Como Montar uma Pizza Margherita', 'Passo a passo completo para preparar uma deliciosa pizza Margherita tradicional', 
 (SELECT id FROM categories WHERE name = 'Pizzas Tradicionais'), 25, 'easy', true);

-- Get the guide ID
DO $$
DECLARE
  guide_id UUID;
BEGIN
  SELECT id INTO guide_id FROM guides WHERE title = 'Como Montar uma Pizza Margherita';
  
  -- Insert steps
  INSERT INTO steps (guide_id, step_number, title, description, tip, duration_seconds) VALUES
  (guide_id, 1, 'Preparar a bancada', 'Limpe e organize a bancada de trabalho. Disponha todos os ingredientes necessários.', 'Mantenha a bancada sempre limpa e organizada', 60),
  (guide_id, 2, 'Abrir a massa', 'Com as mãos ou rolo, abra a massa de pizza começando do centro e trabalhando para as bordas. Deixe a borda mais grossa.', 'Não force demais na borda para manter o formato tradicional', 120),
  (guide_id, 3, 'Adicionar o molho', 'Coloque 3-4 colheres de molho de tomate no centro da massa. Espalhe em movimentos circulares, deixando 2cm de borda.', 'Use movenos suaves para não rasgar a massa', 45),
  (guide_id, 4, 'Adicionar a mussarela', 'Distribua fatias de mussarela uniformemente sobre o molho, mantendo a borda limpa.', null, 30),
  (guide_id, 5, 'Finalizar com manjericão', 'Adicione folhas frescas de manjericão por cima da mussarela.', 'Use folhas inteiras para melhor apresentação', 20),
  (guide_id, 6, 'Assar a pizza', 'Coloque a pizza no forno pré-aquecido a 250°C. Asse por 8-12 minutos até a borda ficar dourada.', 'O forno deve estar bem quente antes de assar', 600);
END $$;

-- Cone Salgado guide
INSERT INTO guides (title, description, category_id, estimated_time, difficulty, is_active) VALUES
('Como Montar um Cone Salgado', 'Guia completo para montar o cone invertido tradicional com recheios salgados', 
 (SELECT id FROM categories WHERE name = 'Cones Salgados'), 15, 'medium', true);

DO $$
DECLARE
  guide_id UUID;
BEGIN
  SELECT id INTO guide_id FROM guides WHERE title = 'Como Montar um Cone Salgado';
  
  INSERT INTO steps (guide_id, step_number, title, description, tip, duration_seconds) VALUES
  (guide_id, 1, 'Preparar o cone', 'Segure o cone pelo vértice (ponta) com uma mão. Verifique se está íntegro e crocante.', 'O cone deve estar sempre crocante e sem rachaduras', 30),
  (guide_id, 2, 'Primeira camada - Molho', 'Adicione uma camada fina de molho no fundo do cone, cerca de 1cm de altura.', 'O molho ajuda a fixar os ingredientes', 20),
  (guide_id, 3, 'Camada de queijo', 'Adicione fatias de mussarela ou outro queijo preferido. Pressione levemente.', null, 30),
  (guide_id, 4, 'Adicionar o recheio principal', 'Coloque o recheio escolhido: presunto, calabresa, frango desfiado, etc.', 'Não encha demais - deixe espaço para finalizar', 45),
  (guide_id, 5, 'Camada de vegetais', 'Adicione tomate em cubos, cebola, azeitonas ou outros vegetais.', null, 30),
  (guide_id, 6, 'Finalização', 'Adicione a última camada de queijo ralado e orégano. Sirva imediatamente.', 'Sirva sempre quente para melhor experiência', 30);
END $$;

-- Routine cleaning guide
INSERT INTO guides (title, description, category_id, estimated_time, difficulty, is_active) VALUES
('Limpeza da Área de Preparo', 'Procedimento diário de limpeza e sanificação da área de preparo de alimentos', 
 (SELECT id FROM categories WHERE name = 'Rotina de Limpeza'), 20, 'easy', true);

DO $$
DECLARE
  guide_id UUID;
BEGIN
  SELECT id INTO guide_id FROM guides WHERE title = 'Limpeza da Área de Preparo';
  
  INSERT INTO steps (guide_id, step_number, title, description, tip, duration_seconds) VALUES
  (guide_id, 1, 'Remover resíduos', 'Retire todos os resíduos sólidos da bancada e piso. Descarte no lixo adequado.', 'Use luvas de proteção durante todo o processo', 120),
  (guide_id, 2, 'Lavar com água e sabão', 'Aplique água e detergente neutro em toda a superfície. Esfregue com esponja.', null, 180),
  (guide_id, 3, 'Enxaguar', 'Enxágue completamente com água limpa, removendo todo o sabão.', null, 90),
  (guide_id, 4, 'Aplicar sanificante', 'Aplique o sanificante próprio para alimentos conforme instruções do fabricante.', 'Deixe agir pelo tempo indicado no produto', 120),
  (guide_id, 5, 'Secar a bancada', 'Use papel toalha descartável para secar completamente a superfície.', 'Nunca use panos de tecido reutilizados', 60),
  (guide_id, 6, 'Organizar utensílios', 'Reposicione todos os utensílios e ingredientes em seus devidos lugares.', null, 120);
END $$;