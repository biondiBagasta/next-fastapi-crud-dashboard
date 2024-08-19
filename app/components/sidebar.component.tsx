"use client"

import { ProductOutlined, MoreOutlined, WindowsOutlined, TruckOutlined, RollbackOutlined } from "@ant-design/icons";
import SidebarMenuItemComponent from "./sidebar-menu-item.component";

interface SidebarProps {
  isOpenedSidebar: boolean;
}

export default function SidebarComponent(props: SidebarProps) {
  return (
    <div className={ props.isOpenedSidebar ? 'sidebar' : 'sidebar close' }>
      <div className="logo-details">
        <img src="/images/next-logo.png"
        className="logo-image" />
        <span className="logo_name">DASHBOARD</span>
      </div>
      <ul className="nav-links">
        <SidebarMenuItemComponent icon={ <WindowsOutlined /> } name='Dashboard' redirectRoute="main" />
        <SidebarMenuItemComponent icon={ <MoreOutlined /> } name="Category" redirectRoute="category" />
        <SidebarMenuItemComponent icon={ <ProductOutlined /> } name="Product" redirectRoute="product" />
        <SidebarMenuItemComponent icon={ <TruckOutlined /> } name="Supplier" redirectRoute="supplier" />
        <SidebarMenuItemComponent icon={ <RollbackOutlined /> } name="Restock" redirectRoute="restock" />
      </ul>
    </div>
  );
}