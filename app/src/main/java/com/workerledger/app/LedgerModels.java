package com.workerledger.app;

import org.json.JSONException;
import org.json.JSONObject;

final class LedgerModels {
    private LedgerModels() {
    }

    static final class Settings {
        long monthlyTakeHomeCents;
        double payMonths = 12;
        double workdaysPerMonth = 21.75;
        double onsiteHoursPerDay = 8;
        double commuteHoursPerDay = 1;
        double overtimeHoursPerMonth;
        long workCostCentsPerMonth;
        long fundGoalCents;
        long fundCurrentCents;
        long updatedAt;
        String salaryEffectiveMonth;

        static Settings defaults() {
            Settings settings = new Settings();
            settings.updatedAt = System.currentTimeMillis();
            return settings;
        }

        static Settings fromJson(JSONObject object) throws JSONException {
            Settings settings = new Settings();
            settings.monthlyTakeHomeCents = object.getLong("monthlyTakeHomeCents");
            settings.payMonths = object.getDouble("payMonths");
            settings.workdaysPerMonth = object.getDouble("workdaysPerMonth");
            settings.onsiteHoursPerDay = object.getDouble("onsiteHoursPerDay");
            settings.commuteHoursPerDay = object.getDouble("commuteHoursPerDay");
            settings.overtimeHoursPerMonth = object.getDouble("overtimeHoursPerMonth");
            settings.workCostCentsPerMonth = object.getLong("workCostCentsPerMonth");
            settings.fundGoalCents = object.getLong("fundGoalCents");
            settings.fundCurrentCents = object.getLong("fundCurrentCents");
            settings.updatedAt = object.optLong("updatedAt", System.currentTimeMillis());
            if (object.has("salaryEffectiveMonth") && !object.isNull("salaryEffectiveMonth")) {
                settings.salaryEffectiveMonth = object.getString("salaryEffectiveMonth");
            }
            return settings;
        }

        JSONObject toJson() throws JSONException {
            JSONObject object = new JSONObject();
            object.put("monthlyTakeHomeCents", monthlyTakeHomeCents);
            object.put("payMonths", payMonths);
            object.put("workdaysPerMonth", workdaysPerMonth);
            object.put("onsiteHoursPerDay", onsiteHoursPerDay);
            object.put("commuteHoursPerDay", commuteHoursPerDay);
            object.put("overtimeHoursPerMonth", overtimeHoursPerMonth);
            object.put("workCostCentsPerMonth", workCostCentsPerMonth);
            object.put("fundGoalCents", fundGoalCents);
            object.put("fundCurrentCents", fundCurrentCents);
            object.put("updatedAt", updatedAt);
            return object;
        }
    }

    static final class Entry {
        long id;
        String kind;
        long amountCents;
        String category;
        String note;
        String entryDate;
        String expenseType;
        long createdAt;
        long updatedAt;
        Long hourlyRateCentsPerHour;

        static Entry fromJson(JSONObject object) throws JSONException {
            Entry entry = new Entry();
            entry.id = object.optLong("id", 0);
            entry.kind = object.getString("kind");
            entry.amountCents = object.getLong("amountCents");
            entry.category = object.getString("category");
            entry.note = object.optString("note", "");
            entry.entryDate = object.getString("entryDate");
            entry.expenseType = object.optString("expenseType", "");
            entry.createdAt = object.optLong("createdAt", System.currentTimeMillis());
            entry.updatedAt = object.optLong("updatedAt", entry.createdAt);
            if (object.has("hourlyRateCentsPerHour") && !object.isNull("hourlyRateCentsPerHour")) {
                entry.hourlyRateCentsPerHour = object.getLong("hourlyRateCentsPerHour");
            }
            return entry;
        }

        JSONObject toJson() throws JSONException {
            JSONObject object = new JSONObject();
            object.put("id", id);
            object.put("kind", kind);
            object.put("amountCents", amountCents);
            object.put("category", category);
            object.put("note", note == null ? "" : note);
            object.put("entryDate", entryDate);
            object.put("expenseType", expenseType == null ? "" : expenseType);
            object.put("createdAt", createdAt);
            object.put("updatedAt", updatedAt);
            object.put("hourlyRateCentsPerHour", hourlyRateCentsPerHour == null ? JSONObject.NULL : hourlyRateCentsPerHour);
            return object;
        }
    }
}
