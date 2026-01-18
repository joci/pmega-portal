# Electronics Inventory Management System
# Table Roles (Business Logic)

This document explains the purpose of each table in the Postgres schema.

## Core reference data

- address
  Stores physical addresses used by customers, suppliers, and users.

- category
  Defines product and spare-part groupings (e.g., TVs, Spare Parts) used for browsing and reporting.

- location
  Represents physical sites (store, workshop, warehouse) where stock and transactions occur.

- customer
  Captures people or organizations who buy products or submit items for repair.

- item
  The product and spare-part catalog (descriptions, pricing, reorder thresholds). This is not per-location stock.

- customer_device
  Tracks customer-owned devices brought in for repair (brand/model/serial). Links to catalog items only when helpful.

- inventory
  The per-location stock ledger for each catalog item, including reserved quantities.

- supplier
  External vendors that provide products or parts.

- item_supplier
  Joins items to suppliers with vendor-specific SKUs and pricing.

- app_user
  Employee accounts and profile data used for operational and audit purposes.

- role
  Defines permission bundles for system access and responsibilities.

- user_role
  Assigns roles to users (supports multiple roles per user).

- repair_service
  External repair providers for outsourced jobs or vendor repairs.

## Maintenance workflow

- maintenance_ticket
  The repair job record for a customer device. Tracks diagnosis, cost, status, and assigned technician.

- part_request
  Records who requested parts for a maintenance ticket, approval status, and preferred sourcing.

- part_usage
  Source of truth for parts actually consumed during repair work. Drives inventory reduction and maintenance reporting.

- ticket_update
  Audit trail of changes on a maintenance ticket (status changes, notes, assignments, cost updates).

## Sales and billing

- sale
  Invoice header for retail, maintenance, and internal transactions. Holds customer, totals, and status.

- sale_item
  Line items for invoices (products, spare parts, labor, fees). Inventory is affected only when marked.

- payment
  Detailed payment history for a sale, including refunds and adjustments.

## Procurement and stock movement

- purchase_order
  Supplier orders for restocking and planned purchases.

- order_item
  Line items for purchase orders, including quantities received.

- stock_movement
  Audit log of inventory changes (sales, repairs, adjustments, transfers, returns).

## Offline sync and system configuration

- sync_queue
  Outbound queue of local changes awaiting cloud sync.

- sync_conflict
  Records conflicts between local and remote data for manual or automatic resolution.

- sync_history
  Audit history of sync sessions with counts and status.

- settings
  Application configuration and feature flags (sync intervals, tax rate, stock alerts).
