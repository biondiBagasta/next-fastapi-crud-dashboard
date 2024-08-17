"use client"

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface SidebarMenuItemProps {
    icon: React.ReactNode;
    name: string;
    redirectRoute: string;
}

export default function SidebarMenuItemComponent(props: SidebarMenuItemProps) {
    const router = useRouter();
    const pathName = usePathname();

    return (
        <li onClick={
            () => {
                router.push("/dashboard/" + props.redirectRoute)
            }
        } style={
            {
                cursor: "pointer"
            }
        } className={
            pathName == `/dashboard/${props.redirectRoute}` ? 'menu-active' : ''
        }>
            <a>
                <i className={
                    pathName == `/dashboard/${props.redirectRoute}` ? 'nav-icon-active' : 'nav-icon'
                }>
                    { props.icon }
                </i>
                <span className={
                    pathName == `/dashboard/${props.redirectRoute}` ? 'link_name_active' : 'link_name'
                }>
                    { props.name }
                </span>
            </a>
            <ul className="sub-menu blank">
                <li>
                    <a className="link_name">{ props.name }</a>
                </li>
            </ul>
        </li>
    );
}