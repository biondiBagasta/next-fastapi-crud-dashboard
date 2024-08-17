import Link from "next/link";

interface PageTitleProps {
	title: string;
	subtitle: string;
}

export default function PageTitleComponent(props: PageTitleProps) {
	return (
		<div className="flex flex-column md:flex-row justify-content-between align-items-center">
			<div className="page-title">
				{ props.title }
			</div>
			<ul className="breadcrumb">
				{
					props.subtitle ? (
						<li>
							<Link href={ '/dashboard/main' } style={
								{
									textDecoration: 'none'
								}
							}>{ props.subtitle }</Link>
						</li>
					) : <></>
				}
				<li>
					{ props.title }
				</li>
			</ul>
		</div>
	)
} 