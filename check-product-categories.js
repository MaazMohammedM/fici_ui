// Quick script to check categories of specific products
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductCategories() {
  const productsToCheck = ['Wcox1144_tan', 'Pslc22_dk.tan'];
  
  for (const articleId of productsToCheck) {
    const { data, error } = await supabase
      .from('products')
      .select('article_id, name, sub_category, category, is_active')
      .eq('article_id', articleId)
      .single();
    
    if (error) {
      console.log(`Product ${articleId}: NOT FOUND or ERROR - ${error.message}`);
    } else {
      console.log(`Product ${articleId}:`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Category: ${data.category}`);
      console.log(`  Sub-category: ${data.sub_category}`);
      console.log(`  Active: ${data.is_active}`);
      console.log('');
    }
  }
  
  // Also get all possible sub_categories
  const { data: categories, error: catError } = await supabase
    .from('products')
    .select('sub_category')
    .eq('is_active', true);
    
  if (!catError && categories) {
    const uniqueCategories = [...new Set(categories.map(c => c.sub_category))];
    console.log('All available sub_categories:');
    uniqueCategories.sort().forEach(cat => console.log(`  - ${cat}`));
  }
}

checkProductCategories().catch(console.error);
