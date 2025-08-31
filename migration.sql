-- Finance App Database Migration (Clean - No Sample Data)
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE section AS ENUM ('Priority Costs', 'Sub Monthly Costs', 'Income');

-- Create main tables
CREATE TABLE months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id UUID NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  section section NOT NULL,
  item TEXT NOT NULL,
  "Amount" NUMERIC(12,2),
  "Day of Payment" TEXT,
  "Before TAX" NUMERIC(12,2),
  "After Tax" NUMERIC(12,2),
  "Tax" NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE month_summary (
  month_id UUID PRIMARY KEY REFERENCES months(id) ON DELETE CASCADE,
  "Cost Per Day_Day" NUMERIC(12,2),
  "Cost Per Day_Month" NUMERIC(12,2),
  "Income Per Day_Day" NUMERIC(12,2),
  "Income Per Day_Month" NUMERIC(12,2),
  "SPARE_Day" NUMERIC(12,2),
  "SPARE_Month" NUMERIC(12,2),
  "SAVE_Day" NUMERIC(12,2),
  "SAVE_Month" NUMERIC(12,2),
  "Personal Money_Day" NUMERIC(12,2),
  "Personal Money_Month" NUMERIC(12,2),
  "Total" NUMERIC(12,2),
  "Total Banked" NUMERIC(12,2),
  "Monthly Extra Tax" NUMERIC(12,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE savings_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id UUID NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month_id, label)
);

CREATE TABLE saving_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal_formula TEXT,
  goal_amount_fallback NUMERIC(12,2),
  resolved_goal_amount NUMERIC(12,2),
  allocation_pct NUMERIC(5,2) DEFAULT 0,
  target_months INTEGER,
  target_date DATE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_months_user_id ON months(user_id);
CREATE INDEX idx_months_created_at ON months(created_at DESC);
CREATE INDEX idx_entries_month_id ON entries(month_id);
CREATE INDEX idx_entries_section ON entries(section);
CREATE INDEX idx_savings_debt_month_id ON savings_debt(month_id);
CREATE INDEX idx_saving_goals_user_id ON saving_goals(user_id);
CREATE INDEX idx_saving_goals_sort_order ON saving_goals(sort_order);

-- Enable Row Level Security
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Months policies
CREATE POLICY "Users can only see their own months" ON months
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entries policies  
CREATE POLICY "Users can only see entries from their own months" ON entries
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = entries.month_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = entries.month_id)
  );

-- Month summary policies
CREATE POLICY "Users can only see summary from their own months" ON month_summary
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = month_summary.month_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = month_summary.month_id)
  );

-- Savings debt policies
CREATE POLICY "Users can only see savings/debt from their own months" ON savings_debt
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = savings_debt.month_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM months WHERE months.id = savings_debt.month_id)
  );

-- Saving goals policies
CREATE POLICY "Users can only see their own saving goals" ON saving_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create a function to automatically update month_summary when entries change
CREATE OR REPLACE FUNCTION update_month_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate summary for the affected month
  INSERT INTO month_summary (
    month_id,
    "Cost Per Day_Month",
    "Income Per Day_Month", 
    "SPARE_Month",
    "Total",
    "Total Banked"
  )
  SELECT 
    COALESCE(NEW.month_id, OLD.month_id) as month_id,
    COALESCE(priority_costs + sub_costs, 0) as "Cost Per Day_Month",
    COALESCE(total_income, 0) as "Income Per Day_Month",
    COALESCE(total_income - (priority_costs + sub_costs), 0) as "SPARE_Month",
    COALESCE(priority_costs + sub_costs, 0) as "Total",
    COALESCE(total_income, 0) as "Total Banked"
  FROM (
    SELECT 
      COALESCE(NEW.month_id, OLD.month_id) as month_id,
      SUM(CASE WHEN section = 'Priority Costs' THEN COALESCE("Amount", 0) ELSE 0 END) as priority_costs,
      SUM(CASE WHEN section = 'Sub Monthly Costs' THEN COALESCE("Amount", 0) ELSE 0 END) as sub_costs,
      SUM(CASE WHEN section = 'Income' THEN COALESCE("After Tax", 0) ELSE 0 END) as total_income
    FROM entries 
    WHERE month_id = COALESCE(NEW.month_id, OLD.month_id)
    GROUP BY month_id
  ) calculations
  ON CONFLICT (month_id) 
  DO UPDATE SET
    "Cost Per Day_Month" = EXCLUDED."Cost Per Day_Month",
    "Income Per Day_Month" = EXCLUDED."Income Per Day_Month",
    "SPARE_Month" = EXCLUDED."SPARE_Month",
    "Total" = EXCLUDED."Total",
    "Total Banked" = EXCLUDED."Total Banked",
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update summaries
CREATE TRIGGER trigger_update_month_summary
  AFTER INSERT OR UPDATE OR DELETE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_month_summary();

-- Create a function to help resolve goal amounts based on formulas
CREATE OR REPLACE FUNCTION resolve_goal_amount(
  formula TEXT,
  fallback_amount NUMERIC,
  monthly_expenses NUMERIC,
  monthly_income NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  CASE 
    WHEN formula = '3x_monthly_expenses' THEN
      RETURN CASE WHEN monthly_expenses > 0 THEN 3 * monthly_expenses ELSE fallback_amount END;
    WHEN formula = '1x_monthly_expenses' THEN
      RETURN CASE WHEN monthly_expenses > 0 THEN monthly_expenses ELSE fallback_amount END;
    WHEN formula = 'min(1500,1x_monthly_income)' THEN
      RETURN CASE WHEN monthly_income > 0 THEN LEAST(1500, monthly_income) ELSE fallback_amount END;
    ELSE
      RETURN fallback_amount;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Finance app database migration completed successfully!';
  RAISE NOTICE 'Database is ready. Sign up in your app to start adding data.';
END $$;