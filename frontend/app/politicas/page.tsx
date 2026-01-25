import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Políticas de Privacidad',
  description: 'Políticas de privacidad y protección de datos personales.',
}

export default function PoliticasPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Políticas de Privacidad</h1>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Información que recopilamos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Recopilamos información que nos proporcionás al reservar un turno, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Preferencias de modalidad de atención (online/presencial)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Uso de la información</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utilizamos la información recopilada únicamente para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                <li>Gestionar y confirmar tus turnos</li>
                <li>Enviarte recordatorios y confirmaciones</li>
                <li>Comunicarnos contigo sobre tu turno</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Confidencialidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Respetamos estrictamente la confidencialidad de tus datos. No compartimos 
                información personal con terceros, excepto cuando sea requerido por ley. 
                Toda la información relacionada con tus sesiones terapéuticas está protegida 
                por el secreto profesional.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Seguridad de los datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger 
                tus datos personales contra acceso no autorizado, pérdida o destrucción. 
                Sin embargo, ningún método de transmisión por Internet es 100% seguro.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Tus derechos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Tenés derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar información incorrecta</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Oponerte al procesamiento de tus datos</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Cookies y tecnologías similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia 
                en nuestro sitio web. Podés configurar tu navegador para rechazar cookies, 
                aunque esto puede afectar algunas funcionalidades del sitio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cambios en esta política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de actualizar esta política de privacidad en 
                cualquier momento. Te notificaremos sobre cambios significativos mediante 
                un aviso en nuestro sitio web o por correo electrónico.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Si tenés preguntas sobre esta política de privacidad o sobre el tratamiento 
                de tus datos personales, podés contactarnos en:
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Email:</strong> hola@dominio.com<br />
                <strong>WhatsApp:</strong> +54 11 0000-0000
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Última actualización: {new Date().toLocaleDateString('es-AR')}</p>
        </div>
      </div>
    </div>
  )
}



