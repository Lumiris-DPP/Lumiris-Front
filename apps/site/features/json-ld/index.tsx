interface JsonLdProps {
    data: Record<string, unknown>;
}

// dangerouslySetInnerHTML preserves byte-identical JSON-LD payload (React would HTML-escape <script> children).
export function JsonLd({ data }: JsonLdProps) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
