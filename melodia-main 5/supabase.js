import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function assertTableName(table) {
  if (!table || typeof table !== "string") {
    throw new Error("A Supabase table name is required.");
  }
}

function throwIfSupabaseError(error) {
  if (error) throw error;
}

export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });

  throwIfSupabaseError(error);
  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  throwIfSupabaseError(error);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  throwIfSupabaseError(error);
  return true;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  throwIfSupabaseError(error);
  return data.user;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  throwIfSupabaseError(error);
  return data.session;
}

export async function sendPasswordReset(email, redirectTo) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  throwIfSupabaseError(error);
  return data;
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  throwIfSupabaseError(error);
  return data;
}

export async function createRecord(table, payload) {
  assertTableName(table);
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

  throwIfSupabaseError(error);
  return data;
}

export async function getRecords(table, options = {}) {
  assertTableName(table);
  const {
    columns = "*",
    filters = {},
    orderBy,
    ascending = true,
    limit
  } = options;

  let query = supabase.from(table).select(columns);

  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });

  if (orderBy) query = query.order(orderBy, { ascending });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  throwIfSupabaseError(error);
  return data;
}

export async function getRecordById(table, id, columns = "*") {
  assertTableName(table);
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("id", id)
    .single();

  throwIfSupabaseError(error);
  return data;
}

export async function updateRecord(table, id, payload) {
  assertTableName(table);
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  throwIfSupabaseError(error);
  return data;
}

export async function deleteRecord(table, id) {
  assertTableName(table);
  const { error } = await supabase.from(table).delete().eq("id", id);
  throwIfSupabaseError(error);
  return true;
}

export function subscribeToTable(table, callback, options = {}) {
  assertTableName(table);
  const { event = "*", schema = "public", filter } = options;
  const channelName = filter ? `${table}:${filter}` : table;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event, schema, table, filter },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
