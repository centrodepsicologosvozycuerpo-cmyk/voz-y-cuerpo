import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Políticas de Privacidad - Voz y Cuerpo',
  description: 'Políticas de privacidad y protección de datos personales de Voz y Cuerpo.',
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
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Preferencias de modalidad de atención (online/presencial)</li>
              </ul>
              <p className="text-muted-foreground">
                Adicionalmente, los profesionales podrán solicitar copia del DNI únicamente cuando sea necesario para confirmar la identidad del paciente, respetando siempre su privacidad y confidencialidad.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Uso de la información</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Utilizamos la información recopilada exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Gestionar y confirmar tus turnos</li>
                <li>Enviar recordatorios y confirmaciones</li>
                <li>Comunicarnos con vos en relación a tu atención</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
              <p className="text-muted-foreground">
                No utilizamos tus datos con fines comerciales ni los compartimos con terceros, salvo obligación legal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Consentimiento informado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Todo paciente tiene derecho a ser informado acerca del tratamiento que se llevará a cabo, su alcance y posibles riesgos.
              </p>
              <p className="text-muted-foreground mb-4">
                Nuestros profesionales son licenciados en psicología y brindan atención en el marco de su formación y habilitación profesional. No están autorizados a prescribir tratamientos farmacológicos, pero podrán realizar derivaciones a profesionales médicos cuando lo consideren necesario.
              </p>
              <p className="text-muted-foreground">
                El consentimiento informado se considera aceptado desde el momento en que el paciente reserva un turno y marca su conformidad con los términos y condiciones de la plataforma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Honorarios y duración de las sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Todos los profesionales de nuestra institución acuerdan un valor ético orientativo, recomendado por los colegios de psicólogos de la República Argentina, teniendo en cuenta los índices inflacionarios vigentes.
              </p>
              <p className="text-muted-foreground mb-4">
                Antes de comenzar la terapia se informará:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>El valor de la sesión</li>
                <li>La duración estimada de cada encuentro</li>
              </ul>
              <p className="text-muted-foreground">
                Cualquier modificación será comunicada previamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Confidencialidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Respetamos estrictamente la confidencialidad de tus datos y del contenido de las sesiones terapéuticas.
              </p>
              <p className="text-muted-foreground mt-4">
                La información compartida durante el proceso terapéutico se encuentra protegida por el secreto profesional, excepto en los casos requeridos por ley.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Firma del consentimiento y rescisión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Al reservar un turno y aceptar los términos, el paciente firma digitalmente el acuerdo de confidencialidad y consentimiento informado.
              </p>
              <p className="text-muted-foreground">
                El paciente puede rescindir este acuerdo en cualquier momento, notificándolo por escrito al correo electrónico de la institución.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Seguridad de los datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra accesos no autorizados, pérdida o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Tus derechos</CardTitle>
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
              <CardTitle>9. Cookies y tecnologías similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestro sitio web. Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Cambios en esta política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de actualizar estas políticas en cualquier momento. Te notificaremos sobre cambios significativos mediante un aviso en nuestro sitio web o por correo electrónico.
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



