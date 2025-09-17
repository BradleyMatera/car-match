// Utility to extract mock arrays from a previous frontend file at build time
// This is used by the seed script only; not part of runtime server.
const fs = require('fs');
const vm = require('vm');

function extractFromSource(source) {
  // Trim off ESM export/footer to avoid syntax errors
  source = String(source).replace(/export\s+default[\s\S]*/, '');
  const context = { console, Date, URL, localStorage: { getItem(){}, setItem(){} } };
  vm.createContext(context);
  // Append an export mapping so we can reliably read constants
  const footer = `\n;try{globalThis.__mockExports={\n  mockUsers: typeof mockUsers!=='undefined'?mockUsers:[],\n  mockProfiles: typeof mockProfiles!=='undefined'?mockProfiles:[],\n  mockEvents: typeof mockEvents!=='undefined'?mockEvents:[],\n  mockMessages: typeof mockMessages!=='undefined'?mockMessages:[],\n  mockForumCategories: typeof mockForumCategories!=='undefined'?mockForumCategories:[],\n  mockForumThreads: typeof mockForumThreads!=='undefined'?mockForumThreads:[],\n  mockForumPosts: typeof mockForumPosts!=='undefined'?mockForumPosts:[]\n};}catch(e){globalThis.__mockExports={mockUsers:[],mockProfiles:[],mockEvents:[],mockMessages:[],mockForumCategories:[],mockForumThreads:[],mockForumPosts:[]}}`;
  vm.runInContext(source + footer, context, { timeout: 5000 });
  const keys = [
    'mockUsers','mockProfiles','mockEvents','mockMessages',
    'mockForumCategories','mockForumThreads','mockForumPosts'
  ];
  const out = {};
  const exported = context.__mockExports || {};
  keys.forEach(k => { if (exported[k]) out[k] = exported[k]; });
  return out;
}

module.exports = { extractFromSource };
